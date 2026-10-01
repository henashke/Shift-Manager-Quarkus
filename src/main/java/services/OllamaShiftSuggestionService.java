package services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import entities.AssignedShift;
import entities.Constraint;
import entities.User;
import io.quarkus.logging.Log;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.util.List;

/**
 * Talks to a locally served LLM (Ollama) to produce shift assignments.
 * <p>
 * The model is asked to return strict JSON which we parse back into {@link AssignedShift}
 * entities. Any failure (model offline, bad response, unparseable JSON) is surfaced as an
 * exception so the caller can fall back to another provider or the deterministic offline algorithm.
 */
@ApplicationScoped
public class OllamaShiftSuggestionService implements ShiftSuggester {

    @ConfigProperty(name = "ollama.enabled", defaultValue = "true")
    boolean enabled;

    @ConfigProperty(name = "ollama.base-url", defaultValue = "http://localhost:11434")
    String baseUrl;

    @ConfigProperty(name = "ollama.model", defaultValue = "llama3.1")
    String model;

    @ConfigProperty(name = "ollama.timeout-seconds", defaultValue = "60")
    long timeoutSeconds;

    @ConfigProperty(name = "ollama.connect-timeout-seconds", defaultValue = "5")
    long connectTimeoutSeconds;

    @ConfigProperty(name = "ollama.temperature", defaultValue = "0.2")
    double temperature;

    @Inject
    ObjectMapper mapper;

    @Inject
    ShiftSuggestionPromptBuilder promptBuilder;

    private HttpClient httpClient;

    @PostConstruct
    void init() {
        // Built here (not as a field initializer) so the injected config values are available.
        httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(connectTimeoutSeconds))
                .build();
    }

    @Override
    public String name() {
        return "ollama";
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    @Override
    public List<AssignedShift> suggest(List<User> users,
                                       List<Constraint> constraints,
                                       LocalDate startDate,
                                       LocalDate endDate) throws Exception {
        String prompt = promptBuilder.buildPrompt(users, constraints, startDate, endDate);

        ObjectNode requestBody = mapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);
        // Force the model to emit syntactically valid JSON.
        requestBody.put("format", "json");
        ObjectNode options = mapper.createObjectNode();
        // Low temperature -> more deterministic, schedule-friendly output.
        options.put("temperature", temperature);
        requestBody.set("options", options);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/api/generate"))
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(requestBody)))
                .build();

        Log.infof("Requesting shift suggestions from Ollama model '%s' at %s", model, baseUrl);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "Ollama returned HTTP " + response.statusCode() + ": " + response.body());
        }

        // /api/generate wraps the model output in {"response": "<json string>", ...}
        JsonNode envelope = mapper.readTree(response.body());
        String modelOutput = envelope.path("response").asText();
        return promptBuilder.parseAssignments(modelOutput, users);
    }
}
