package com.example.sample;

import java.util.ArrayList;
import java.util.List;

/**
 * Already conforms to the shared style: this file must pass both Spotless and Checkstyle untouched.
 */
public class Greeter {

    private static final String DEFAULT_NAME = "world";

    // @formatter:off
    // Hand-aligned table: the formatter must leave this block alone (use_on_off_tags=true).
    private static final int[][] LOOKUP = {
        { 1,   2,   3 },
        { 10,  20,  30 },
        { 100, 200, 300 },
    };
    // @formatter:on

    private final String greeting;

    public Greeter(String greeting) {
        this.greeting = greeting;
    }

    public String greet(String name) {
        if (name == null || name.isEmpty()) {
            return greeting + ", " + DEFAULT_NAME + "!";
        } else {
            return greeting + ", " + name + "!";
        }
    }

    public List<String> greetAll(List<String> names) {
        final List<String> result = new ArrayList<>();
        for (String name : names) {
            result.add(greet(name));
        }
        return result;
    }

}
