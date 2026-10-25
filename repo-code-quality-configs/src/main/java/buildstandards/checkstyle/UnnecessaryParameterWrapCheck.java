package buildstandards.checkstyle;

import com.puppycrawl.tools.checkstyle.api.AbstractCheck;
import com.puppycrawl.tools.checkstyle.api.DetailAST;
import com.puppycrawl.tools.checkstyle.api.TokenTypes;

/**
 * Flags method and constructor declarations whose parameter list is wrapped although the whole declaration, from its
 * first modifier (or type) to the opening brace, would fit within {@code max} columns on one line.
 * <p>
 * The formatter keeps existing line breaks ({@code join_wrapped_lines=false}) so that deliberately wrapped call
 * arguments survive; this check catches the declarations that were wrapped without needing to be. Annotations on
 * lines of their own above the declaration are not counted. Declarations containing comments are skipped.
 */
public class UnnecessaryParameterWrapCheck extends AbstractCheck {

    static final String MSG_KEY = "parameters.fit.on.one.line";

    private int max = 160;

    /**
     * Maximum line length the joined declaration must fit in.
     *
     * @param max the limit, default 160 (the formatter's lineSplit)
     */
    public void setMax(int max) { this.max = max; }

    @Override
    public int[] getDefaultTokens() { return new int[]{TokenTypes.METHOD_DEF, TokenTypes.CTOR_DEF}; }

    @Override
    public int[] getAcceptableTokens() { return getDefaultTokens(); }

    @Override
    public int[] getRequiredTokens() { return new int[0]; }

    @Override
    public void visitToken(DetailAST ast) {

        final DetailAST lparen = ast.findFirstToken(TokenTypes.LPAREN);
        final DetailAST rparen = ast.findFirstToken(TokenTypes.RPAREN);
        if (lparen.getLineNo() == rparen.getLineNo()) {
            return;
        }

        DetailAST end = ast.findFirstToken(TokenTypes.SLIST);
        if (end == null) {
            end = ast.findFirstToken(TokenTypes.SEMI);
        }
        final DetailAST start = headerStart(ast);
        if (end == null || start == null) {
            return;
        }

        final StringBuilder joined = new StringBuilder();
        for (int line = start.getLineNo(); line <= end.getLineNo(); line++) {
            String text = getLine(line - 1);
            if (line == end.getLineNo()) {
                text = text.substring(0, end.getColumnNo() + 1);
            }
            if (line == start.getLineNo()) {
                text = text.substring(start.getColumnNo());
            }
            text = text.trim();
            if (text.contains("//") || text.contains("/*")) {
                return; // joining would swallow or move a comment
            }
            if (!text.isEmpty()) {
                if (joined.length() > 0) {
                    joined.append(' ');
                }
                joined.append(text);
            }
        }
        final String declaration = joined.toString().replace("( ", "(").replace(" )", ")");
        final int length = start.getColumnNo() + declaration.length();
        if (length <= max) {
            log(lparen.getLineNo(), MSG_KEY, length, max);
        }

    }

    /** First token of the declaration after any leading annotations: a modifier, type parameters, type or name. */
    private static DetailAST headerStart(DetailAST ast) {
        for (DetailAST child = ast.getFirstChild(); child != null; child = child.getNextSibling()) {
            if (child.getType() == TokenTypes.MODIFIERS) {
                for (DetailAST modifier = child.getFirstChild(); modifier != null; modifier = modifier.getNextSibling()) {
                    if (modifier.getType() != TokenTypes.ANNOTATION) {
                        return firstLeaf(modifier);
                    }
                }
            } else {
                return firstLeaf(child);
            }
        }
        return null;
    }

    /** The token that appears first in the source within the subtree (imaginary tokens carry no position of their own). */
    private static DetailAST firstLeaf(DetailAST ast) {
        DetailAST first = ast;
        for (DetailAST child = ast.getFirstChild(); child != null; child = child.getNextSibling()) {
            final DetailAST candidate = firstLeaf(child);
            if (candidate.getLineNo() < first.getLineNo() ||
                candidate.getLineNo() == first.getLineNo() && candidate.getColumnNo() < first.getColumnNo()) {
                first = candidate;
            }
        }
        return first;
    }

}
