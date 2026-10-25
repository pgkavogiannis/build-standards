package buildstandards.checkstyle;

import com.puppycrawl.tools.checkstyle.Checker;
import com.puppycrawl.tools.checkstyle.DefaultConfiguration;
import com.puppycrawl.tools.checkstyle.api.AuditEvent;
import com.puppycrawl.tools.checkstyle.api.AuditListener;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/** Runs a single check through a real Checker and returns "line: message" for every violation. */
final class CheckRunner {

    private CheckRunner() {}

    static List<String> run(Class<?> check, Map<String, String> properties, String source) throws Exception {

        final DefaultConfiguration checkConfig = new DefaultConfiguration(check.getName());
        properties.forEach(checkConfig::addProperty);
        final DefaultConfiguration treeWalker = new DefaultConfiguration("TreeWalker");
        treeWalker.addChild(checkConfig);
        final DefaultConfiguration root = new DefaultConfiguration("Checker");
        root.addChild(treeWalker);

        final Checker checker = new Checker();
        checker.setModuleClassLoader(CheckRunner.class.getClassLoader());
        checker.configure(root);
        final List<String> violations = new ArrayList<>();
        checker.addListener(new AuditListener() {

            @Override
            public void auditStarted(AuditEvent event) {}

            @Override
            public void auditFinished(AuditEvent event) {}

            @Override
            public void fileStarted(AuditEvent event) {}

            @Override
            public void fileFinished(AuditEvent event) {}

            @Override
            public void addError(AuditEvent event) { violations.add(event.getLine() + ": " + event.getMessage()); }

            @Override
            public void addException(AuditEvent event, Throwable throwable) { throw new AssertionError(throwable); }

        });

        final Path file = Files.createTempFile("Sample", ".java");
        try {
            Files.writeString(file, source);
            checker.process(List.of(new File(file.toString())));
        } finally {
            checker.destroy();
            Files.delete(file);
        }

        return violations;
    }

}
