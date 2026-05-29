package services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import io.quarkus.runtime.StartupEvent;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class ConfigurationLogger {

    @ConfigProperty(name = "quarkus.http.cors.origins")
    String corsOrigins;

    @ConfigProperty(name = "quarkus.http.cors.methods")
    String corsMethods;

    void onStart(@Observes StartupEvent event) {
        System.out.println("=== CORS Configuration ===");
        System.out.println("CORS Origins: " + corsOrigins);
        System.out.println("CORS Methods: " + corsMethods);
        System.out.println("==========================");
    }
}

