import { expect, afterEach } from "bun:test";
import * as matchers from "@testing-library/jest-dom/matchers";
import "../happydom.ts";

afterEach(() => {
  document.body.innerHTML = "";
});

expect.extend(matchers);
