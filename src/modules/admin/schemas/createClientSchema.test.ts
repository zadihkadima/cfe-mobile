import { createClientSchema, CreateClientFormData } from "./createClientSchema";
import type { CreateClientRequest } from "../api/client/types";

/**
 * These tests exist because this schema shipped broken.
 *
 * It declared `FirstName`/`LastName`/`Email` while the API requires
 * `first_name`/`last_name`/`email`. The create screen typed its submit handler
 * as `any`, so the compiler could not object, and the result was that client
 * creation always failed with a 400 and the edit form always rendered blank.
 * The defect was invisible in review because every individual file looked
 * reasonable; only the seam between them was wrong.
 *
 * The first test is therefore the important one: it asserts the schema output
 * is assignable to the transport type, which makes a repeat of that divergence
 * a compile error rather than a production outage.
 */
describe("createClientSchema", () => {
  it("produces a payload that satisfies the API request contract", () => {
    const parsed = createClientSchema.parse({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
    });

    // The annotation is the assertion. If the schema drifts from the transport
    // type again, this file stops compiling.
    const request: CreateClientRequest = parsed;

    expect(request).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
    });
  });

  it("rejects the legacy PascalCase shape that used to be sent", () => {
    const result = createClientSchema.safeParse({
      FirstName: "Ada",
      LastName: "Lovelace",
      Email: "ada@example.com",
    });

    expect(result.success).toBe(false);
  });

  it("trims surrounding whitespace so a stray space cannot create a duplicate account", () => {
    const parsed = createClientSchema.parse({
      first_name: "  Ada  ",
      last_name: "  Lovelace  ",
      email: "  ada@example.com  ",
    });

    expect(parsed).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
    });
  });

  it("treats a whitespace-only name as missing rather than valid", () => {
    const result = createClientSchema.safeParse({
      first_name: "   ",
      last_name: "Lovelace",
      email: "ada@example.com",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a malformed email before it reaches the invitation mailer", () => {
    const result = createClientSchema.safeParse({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@",
    });

    expect(result.success).toBe(false);
  });

  it("reports the failing field by its API name so the form can bind the error", () => {
    const result = createClientSchema.safeParse({
      first_name: "A",
      last_name: "Lovelace",
      email: "ada@example.com",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(["first_name"]);
    }
  });

  it("exposes exactly the three fields the create endpoint accepts", () => {
    const parsed: CreateClientFormData = createClientSchema.parse({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@example.com",
    });

    expect(Object.keys(parsed).sort()).toEqual([
      "email",
      "first_name",
      "last_name",
    ]);
  });
});
