import { afterEach } from "bun:test";
import "../happydom.ts";

afterEach(() => {
  document.body.innerHTML = "";
});
