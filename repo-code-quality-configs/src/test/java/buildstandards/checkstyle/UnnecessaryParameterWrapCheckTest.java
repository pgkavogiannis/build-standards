package buildstandards.checkstyle;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UnnecessaryParameterWrapCheckTest {

    private static List<String> check(String source) throws Exception {
        return CheckRunner.run(UnnecessaryParameterWrapCheck.class, Map.of(), source);
    }

    @Test
    void wrappedParametersThatFitAreFlagged() throws Exception {
        assertEquals(
            List.of(
                "3: Parameters are wrapped but the declaration fits on one line (102 of 160 columns): keep it on one line.",
                "9: Parameters are wrapped but the declaration fits on one line (21 of 160 columns): keep it on one line."
            ),
            check("""
                class A {
                    @Override
                    public static String parse(
                        String file,
                        @Nullable
                        String charsetName
                    ) throws java.io.IOException { return null; }

                    A(int a,
                      int b) {}
                }
                """)
        );
    }

    @Test
    void declarationsOnOneLineOrTooLongToJoinAreNotFlagged() throws Exception {
        final String longName = "x".repeat(120);
        assertEquals(List.of(), check("""
            interface A {
                String parse(String file, String charsetName);
                String wrapped(
                    String %s,
                    String other
                );
            }
            """.formatted(longName)));
    }

    @Test
    void declarationsWithCommentsAreSkipped() throws Exception {
        assertEquals(List.of(), check("""
            class A {
                void f(
                    int a, // first
                    int b
                ) {}
            }
            """));
    }

    @Test
    void limitIsConfigurable() throws Exception {
        assertEquals(List.of(), CheckRunner.run(UnnecessaryParameterWrapCheck.class, Map.of("max", "20"), """
            class A {
                A(int alpha,
                  int beta) {}
            }
            """));
    }

}
