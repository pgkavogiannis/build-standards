package buildstandards.checkstyle;

import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static buildstandards.checkstyle.CheckRunner.source;
import static org.junit.jupiter.api.Assertions.assertEquals;

class BlankLinesInBodyCheckTest {

    private static List<String> check(String source) throws Exception {
        return CheckRunner.run(BlankLinesInBodyCheck.class, Collections.emptyMap(), source);
    }

    @Test
    void smallBodiesAreNotChecked() throws Exception {
        assertEquals(Collections.emptyList(), check(source(
            "class A {",
            "",
            "    int x;",
            "    int one() { return x; }",
            "    int four() {",
            "        int a = x;",
            "        int b = a + 1;",
            "        int c = b + 1;",
            "        return c;",
            "    }",
            "    void voidFour() {",
            "        x++;",
            "        x++;",
            "        x++;",
            "        x++;",
            "    }",
            "}"
        )));
    }

    @Test
    void largeMethodNeedsBlankAfterOpenAndBeforeReturn() throws Exception {
        assertEquals(
            Arrays.asList(
                "4: Body has more than 4 statements or members: add a blank line after the opening brace.",
                "9: Body has more than 4 statements: add a blank line before the final return."
            ),
            check(source(
                "class A {",
                "",
                "    int x;",
                "    int five() {",
                "        int a = x;",
                "        int b = a + 1;",
                "        int c = b + 1;",
                "        int d = c + 1;",
                "        return d;",
                "    }",
                "",
                "}"
            ))
        );
    }

    @Test
    void largeMethodFollowingTheRulesPasses() throws Exception {
        assertEquals(Collections.emptyList(), check(source(
            "class A {",
            "",
            "    int x;",
            "    int five() {",
            "",
            "        int a = x;",
            "        int b = a + 1;",
            "        int c = b + 1;",
            "        int d = c + 1;",
            "",
            "        // explain the result",
            "        return d + 1;",
            "    }",
            "",
            "}"
        )));
    }

    @Test
    void returnDirectlyAfterACommentNeedsTheBlankLineAboveTheComment() throws Exception {
        assertEquals(Arrays.asList("11: Body has more than 4 statements: add a blank line before the final return."), check(source(
            "class A {",
            "",
            "    int x;",
            "    int five() {",
            "",
            "        int a = x;",
            "        int b = a + 1;",
            "        int c = b + 1;",
            "        int d = c + 1;",
            "        // explain the result",
            "        return d + 1;",
            "    }",
            "",
            "}"
        )));
    }

    @Test
    void largeVoidMethodAndConstructorNeedBlankBeforeClose() throws Exception {
        assertEquals(
            Arrays.asList(
                "11: Void method or constructor body has more than 4 statements: add a blank line before the closing brace.",
                "19: Void method or constructor body has more than 4 statements: add a blank line before the closing brace."
            ),
            check(source(
                "class A {",
                "",
                "    int x;",
                "    void run() {",
                "",
                "        x++;",
                "        x++;",
                "        x++;",
                "        x++;",
                "        x++;",
                "    }",
                "    A() {",
                "",
                "        x = 1;",
                "        x++;",
                "        x++;",
                "        x++;",
                "        x++;",
                "    }",
                "",
                "}"
            ))
        );
    }

    @Test
    void largeTypeBodyNeedsBlankAfterOpenButAnonymousAndEnumConstantBodiesDoNot() throws Exception {
        assertEquals(Arrays.asList("1: Body has more than 4 statements or members: add a blank line after the opening brace."), check(source(
            "class A {",
            "    int a;",
            "    int b;",
            "    int z;",
            "    Runnable r = new Runnable() {",
            "        public void run() {}",
            "        int c;",
            "        int d;",
            "    };",
            "    enum E {",
            "",
            "        ONE {",
            "            int e;",
            "            int f;",
            "            int g;",
            "            int h;",
            "            int i;",
            "        }",
            "",
            "    }",
            "",
            "}"
        )));
    }

    @Test
    void thresholdIsConfigurable() throws Exception {
        final String source = source(
            "class A {",
            "",
            "    int x;",
            "    int two() {",
            "        int a = x;",
            "        return a;",
            "    }",
            "",
            "}"
        );
        assertEquals(Collections.emptyList(), check(source));
        assertEquals(
            Arrays.asList(
                "4: Body has more than 1 statements or members: add a blank line after the opening brace.",
                "6: Body has more than 1 statements: add a blank line before the final return."
            ),
            CheckRunner.run(BlankLinesInBodyCheck.class, Collections.singletonMap("maxSmallBodySize", "1"), source)
        );
    }

}
