package buildstandards.checkstyle;

import com.puppycrawl.tools.checkstyle.Checker;
import com.puppycrawl.tools.checkstyle.ConfigurationLoader;
import com.puppycrawl.tools.checkstyle.PropertiesExpander;
import com.puppycrawl.tools.checkstyle.api.Configuration;
import org.junit.jupiter.api.Test;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Properties;

import static org.junit.jupiter.api.Assertions.assertEquals;

/** The checkstyle.xml shipped in this JAR must load and run, including the custom checks and their properties. */
class ShippedConfigTest {

    @Test
    void shippedConfigurationLoadsAndRuns() throws Exception {

        final Properties properties = new Properties();
        properties.setProperty("checkstyle.suppressions.file", resource("suppressions.xml"));
        final Configuration config = ConfigurationLoader.loadConfiguration(
            resource("checkstyle.xml"),
            new PropertiesExpander(properties),
            ConfigurationLoader.IgnoredModulesOptions.OMIT
        );

        final Checker checker = new Checker();
        checker.setModuleClassLoader(ShippedConfigTest.class.getClassLoader());
        checker.configure(config);
        final Path file = Files.createTempFile("Clean", ".java");
        try {
            Files.writeString(file, "class Clean {\n\n    private final int x = 1;\n\n}\n");
            assertEquals(0, checker.process(List.of(new File(file.toString()))));
        } finally {
            checker.destroy();
            Files.delete(file);
        }

    }

    private static String resource(String name) throws Exception {
        return Path.of(ShippedConfigTest.class.getClassLoader().getResource(name).toURI()).toString();
    }

}
