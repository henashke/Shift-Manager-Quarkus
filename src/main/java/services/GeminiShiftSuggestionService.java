package services;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
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
 * Talks to Google AI Studio's Gemini API ({@code generateContent}) to produce shift assignments.
 * <p>
 * Uses the same prompt and JSON contract as the other providers (via {@link ShiftSuggestionPromptBuilder}),
 * asking Gemini for {@code application/json} output. Any failure is surfaced as an exception so the
 * caller can fall back to another provider or the deterministic offline algorithm.
 *
 * @see <a href="https://ai.google.dev/api/generate-content">ai.google.dev/api/generate-content</a>
 */
@ApplicationScoped
public class GeminiShiftSuggestionService implements ShiftSuggester {

    @ConfigProperty(name = "gemini.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "gemini.base-url", defaultValue = "https://generativelanguage.googleapis.com/v1beta")
    String baseUrl;

    @ConfigProperty(name = "gemini.model", defaultValue = "gemini-2.5-flash")
    String model;

    @ConfigProperty(name = "gemini.api-key", defaultValue = "")
    String apiKey;

    @ConfigProperty(name = "gemini.timeout-seconds", defaultValue = "60")
    long timeoutSeconds;

    @ConfigProperty(name = "gemini.connect-timeout-seconds", defaultValue = "5")
    long connectTimeoutSeconds;

    @ConfigProperty(name = "gemini.temperature", defaultValue = "0.2")
    double temperature;

    @Inject
    ObjectMapper mapper;

    @Inject
    ShiftSuggestionPromptBuilder promptBuilder;

    private HttpClient httpClient;

    @PostConstruct
    void init() {
        httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(connectTimeoutSeconds))
                .build();
    }

    @Override
    public String name() {
        return "gemini";
    }

    @Override
    public boolean isEnabled() {
        return enabled && !apiKey.isBlank();
    }

    @Override
    public List<AssignedShift> suggest(List<User> users,
                                       List<Constraint> constraints,
                                       LocalDate startDate,
                                       LocalDate endDate) throws Exception {
        String prompt = promptBuilder.buildPrompt(users, constraints, startDate, endDate);

        // Body shape: { "contents": [ { "parts": [ { "text": ... } ] } ], "generationConfig": {...} }
        ObjectNode requestBody = mapper.createObjectNode();
        ArrayNode contents = requestBody.putArray("contents");
        ObjectNode content = contents.addObject();
        content.putArray("parts").addObject().put("text", prompt);

        ObjectNode generationConfig = requestBody.putObject("generationConfig");
        generationConfig.put("temperature", temperature);
        // Force a raw JSON response (no markdown fences) matching our schema.
        generationConfig.put("responseMimeType", "application/json");

        URI uri = URI.create(baseUrl + "/models/" + model + ":generateContent");
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .header("Content-Type", "application/json")
                .header("x-goog-api-key", apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(requestBody)))
                .build();

        Log.infof("Requesting shift suggestions from Gemini model '%s'", model);
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IllegalStateException(
                    "Gemini returned HTTP " + response.statusCode() + ": " + response.body());
        }

        // candidates[0].content.parts[0].text holds the JSON string we asked for.
        JsonNode envelope = mapper.readTree(response.body());
        JsonNode textNode = envelope.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text");
        if (textNode.isMissingNode() || textNode.asText().isBlank()) {
            throw new IllegalStateException("Gemini response had no text candidate: " + response.body());
        }
        return promptBuilder.parseAssignments(textNode.asText(), users);
    }
}
