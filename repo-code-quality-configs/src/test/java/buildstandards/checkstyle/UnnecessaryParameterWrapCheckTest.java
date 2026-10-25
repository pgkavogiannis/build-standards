package buildstandards.checkstyle;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static buildstandards.checkstyle.CheckRunner.source;
import static org.junit.jupiter.api.Assertions.assertEquals;

class UnnecessaryParameterWrapCheckTest {

    private static List<String> check(String source) throws Exception {
        return CheckRunner.run(UnnecessaryParameterWrapCheck.class, Collections.emptyMap(), source);
    }

    @Test
    void wrappedParametersThatFitAreFlagged() throws Exception {
        assertEquals(
            Arrays.asList(
                "3: Parameters are wrapped but the declaration fits on one line (102 of 160 columns): keep it on one line.",
                "9: Parameters are wrapped but the declaration fits on one line (21 of 160 columns): keep it on one line."
            ),
            check(source(
                "class A {",
                "    @Override",
                "    public static String parse(",
                "        String file,",
                "        @Nullable",
                "        String charsetName",
                "    ) throws java.io.IOException { return null; }",
                "",
                "    A(int a,",
                "      int b) {}",
                "}"
            ))
        );
    }

    @Test
    void declarationsOnOneLineOrTooLongToJoinAreNotFlagged() throws Exception {
        final String longName = String.join("", Collections.nCopies(120, "x"));
        assertEquals(Collections.emptyList(), check(String.format(source(
            "interface A {",
            "    String parse(String file, String charsetName);",
            "    String wrapped(",
            "        String %s,",
            "        String other",
            "    );",
            "}"
        ), longName)));
    }

    @Test
    void declarationsWithCommentsAreSkipped() throws Exception {
        assertEquals(Collections.emptyList(), check(source(
            "class A {",
            "    void f(",
            "        int a, // first",
            "        int b",
            "    ) {}",
            "}"
        )));
    }

    @Test
    void limitIsConfigurable() throws Exception {
        assertEquals(Collections.emptyList(), CheckRunner.run(UnnecessaryParameterWrapCheck.class, Collections.singletonMap("max", "20"), source(
            "class A {",
            "    A(int alpha,",
            "      int beta) {}",
            "}"
        )));
    }

}
