package buildstandards.checkstyle;

import com.puppycrawl.tools.checkstyle.api.AbstractCheck;
import com.puppycrawl.tools.checkstyle.api.DetailAST;
import com.puppycrawl.tools.checkstyle.api.TokenTypes;

/**
 * Requires blank lines inside bodies that are not small. A method or constructor body is small when it has at most
 * {@code maxSmallBodySize} top-level statements; a class, interface, enum, record or annotation body is small when it
 * has at most that many members.
 * <ul>
 * <li>Methods and constructors: a blank line after the opening brace; a blank line before the final {@code return};
 * a blank line before the closing brace of {@code void} methods and constructors.</li>
 * <li>Class, interface, enum, record and annotation bodies: a blank line after the opening brace (the blank line
 * before the closing brace is enforced by the formatter).</li>
 * </ul>
 * Small bodies are not checked. Anonymous classes and enum constant bodies are not checked.
 */
public class BlankLinesInBodyCheck extends AbstractCheck {

    static final String MSG_AFTER_OPEN = "blank.line.after.open";
    static final String MSG_BEFORE_RETURN = "blank.line.before.return";
    static final String MSG_BEFORE_CLOSE = "blank.line.before.close";

    private static final int[] TOKENS = {
        TokenTypes.METHOD_DEF,
        TokenTypes.CTOR_DEF,
        TokenTypes.COMPACT_CTOR_DEF,
        TokenTypes.CLASS_DEF,
        TokenTypes.INTERFACE_DEF,
        TokenTypes.ENUM_DEF,
        TokenTypes.RECORD_DEF,
        TokenTypes.ANNOTATION_DEF,
    };

    private int maxSmallBodySize = 4;

    /**
     * Bodies with at most this many top-level statements (methods, constructors) or members (types) are small.
     *
     * @param maxSmallBodySize the threshold, default 4
     */
    public void setMaxSmallBodySize(int maxSmallBodySize) { this.maxSmallBodySize = maxSmallBodySize; }

    @Override
    public int[] getDefaultTokens() { return TOKENS.clone(); }

    @Override
    public int[] getAcceptableTokens() { return TOKENS.clone(); }

    @Override
    public int[] getRequiredTokens() { return new int[0]; }

    @Override
    public void visitToken(DetailAST ast) {

        final boolean callable = ast.getType() == TokenTypes.METHOD_DEF ||
            ast.getType() == TokenTypes.CTOR_DEF ||
            ast.getType() == TokenTypes.COMPACT_CTOR_DEF;
        final DetailAST open;
        final DetailAST close;
        final int size;
        if (callable) {
            open = ast.findFirstToken(TokenTypes.SLIST);
            if (open == null) {
                return; // abstract, interface or native method
            }
            close = open.getLastChild();
            size = countChildren(open);
        } else {
            final DetailAST objBlock = ast.findFirstToken(TokenTypes.OBJBLOCK);
            open = objBlock.findFirstToken(TokenTypes.LCURLY);
            close = objBlock.getLastChild();
            size = countChildren(objBlock);
        }

        final int openLine = open.getLineNo();
        final int closeLine = close.getLineNo();
        if (size <= maxSmallBodySize || closeLine - openLine < 2) {
            return;
        }

        if (!hasCodeAfter(open) && !isBlank(openLine + 1)) {
            log(openLine, MSG_AFTER_OPEN, maxSmallBodySize);
        }
        if (!callable) {
            return;
        }

        final boolean voidLike = ast.getType() != TokenTypes.METHOD_DEF ||
            ast.findFirstToken(TokenTypes.TYPE).findFirstToken(TokenTypes.LITERAL_VOID) != null;
        if (voidLike && !hasCodeBefore(close) && !isBlank(closeLine - 1)) {
            log(closeLine, MSG_BEFORE_CLOSE, maxSmallBodySize);
        }

        final DetailAST lastStatement = close.getPreviousSibling();
        if (lastStatement != null &&
            lastStatement.getType() == TokenTypes.LITERAL_RETURN &&
            lastStatement != open.getFirstChild()) {
            // a comment directly above the return belongs to it: the blank line goes above the comment
            int above = lastStatement.getLineNo() - 1;
            while (above > openLine && isCommentOnly(above)) {
                above--;
            }
            if (above > openLine && !isBlank(above)) {
                log(lastStatement.getLineNo(), MSG_BEFORE_RETURN, maxSmallBodySize);
            }
        }

    }

    /** Statements of a block or members of a type body: everything between the braces except separators. */
    private static int countChildren(DetailAST body) {

        int count = 0;
        for (DetailAST child = body.getFirstChild(); child != null; child = child.getNextSibling()) {
            final int type = child.getType();
            if (type != TokenTypes.LCURLY && type != TokenTypes.RCURLY && type != TokenTypes.SEMI && type != TokenTypes.COMMA) {
                count++;
            }
        }

        return count;
    }

    /** True if the opening brace is followed by code (not just a comment) on its own line. */
    private boolean hasCodeAfter(DetailAST brace) {
        final String rest = getLine(brace.getLineNo() - 1).substring(brace.getColumnNo() + 1).trim();
        return !rest.isEmpty() && !rest.startsWith("//") && !rest.startsWith("/*");
    }

    /** True if the closing brace is preceded by code on its own line. */
    private boolean hasCodeBefore(DetailAST brace) {
        return !getLine(brace.getLineNo() - 1).substring(0, brace.getColumnNo()).trim().isEmpty();
    }

    private boolean isBlank(int lineNo) {
        return getLine(lineNo - 1).trim().isEmpty();
    }

    private boolean isCommentOnly(int lineNo) {
        final String text = getLine(lineNo - 1).trim();
        return text.startsWith("//") || text.startsWith("/*") || text.startsWith("*");
    }

}
