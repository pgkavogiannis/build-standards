package com.example.sample;

import java.util.*;
import java.util.List;
import java.util.List;
import java.util.Date;

/** Checkstyle violations only: imports, naming, simplifiable booleans, braces, declaration order, blank lines, wrapping, tab, array style, lowercase long suffix. */
public class StyleViolations {

    public static final int bad_constant = 1;

    private int hits;
    public int misses;

    public boolean isPositive(int Value) {
        if (Value > 0) {
            return true;
        } else {
            return false;
        }
    }

    public int clamp(int v) {
        if (v < 0)
            return 0;
        return v;
    }

    public int sum(int a,
            int b) {
        int base = a;
        int total = base;
        total += b;
        total += base;
        return total;
    }

    public boolean isEnabled(boolean flag) {
        return flag == true;
    }

    public long big() {
        final int Local_Var = 5;
        final int numbers[] = new int[] { 1, 2, 3 };
	return 10l + Local_Var + numbers.length;
    }

    interface Constants {

        int LIMIT = 10;
    }
}
