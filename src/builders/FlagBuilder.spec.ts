import { test, expect, describe } from "bun:test";
import { FlagBuilder } from "./FlagBuilder";

describe("FlagBuilder", () => {
  describe("Creation with aliases", () => {
    test("should create FlagBuilder with single alias", () => {
      const builder = FlagBuilder.create("--port");
      expect(builder).toBeInstanceOf(FlagBuilder);
    });

    test("should create FlagBuilder with multiple aliases", () => {
      const builder = FlagBuilder.create("-p", "--port");
      expect(builder).toBeInstanceOf(FlagBuilder);
    });

    test("should throw error when creating without aliases", () => {
      expect(() => FlagBuilder.create()).toThrow();
    });

    test("should store aliases in metadata", () => {
      const builder = FlagBuilder.create("-p", "--port");
      const metadata = builder.spec.copyMetadata();
      expect(metadata.names).toEqual(["-p", "--port"]);
    });
  });

  describe("Parsing - Basic flag matching", () => {
    test("should match first alias", () => {
      const builder = FlagBuilder.create("-p", "--port").string();
      const result = builder.parse(0, ["-p", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("8080");
    });

    test("should match second alias", () => {
      const builder = FlagBuilder.create("-p", "--port").string();
      const result = builder.parse(0, ["--port", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("8080");
    });

    test("should return null for non-matching flag", () => {
      const builder = FlagBuilder.create("-p", "--port").string();
      const result = builder.parse(0, ["--other", "value"]);
      
      expect(result).toBeNull();
    });
  });

  describe("Parsing - Inline vs Separated values", () => {
    test("should parse inline value with =", () => {
      const builder = FlagBuilder.create("--port").string();
      const result = builder.parse(0, ["--port=8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("8080");
      expect(result?.args).toEqual(["--port=8080"]);
    });

    test("should parse separated value", () => {
      const builder = FlagBuilder.create("--port").string();
      const result = builder.parse(0, ["--port", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("8080");
      expect(result?.args).toEqual(["--port", "8080"]);
    });

    test("should parse inline value with short flag", () => {
      const builder = FlagBuilder.create("-p").string();
      const result = builder.parse(0, ["-p=8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("8080");
    });

    test("should handle multiple = in inline value", () => {
      const builder = FlagBuilder.create("--key").string();
      const result = builder.parse(0, ["--key=foo=bar=baz"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("foo=bar=baz");
    });
  });

  describe("Parsing - Values that look like flags", () => {
    test("should accept negative number as value", () => {
      const builder = FlagBuilder.create("--delta").string();
      const result = builder.parse(0, ["--delta", "-5"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("-5");
    });

    test("should accept value starting with --", () => {
      const builder = FlagBuilder.create("--key").string();
      const result = builder.parse(0, ["--key", "--123"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("--123");
    });

    test("should accept value starting with - ", () => {
      const builder = FlagBuilder.create("--key").string();
      const result = builder.parse(0, ["--key", "-abc"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("-abc");
    });
  });

  describe("BooleanFlagBuilder", () => {
    test("should create boolean flag", () => {
      const builder = FlagBuilder.create("--verbose").boolean();
      const result = builder.parse(0, ["--verbose"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe(true);
    });

    test("should handle flag presence with alias", () => {
      const builder = FlagBuilder.create("-v", "--verbose").boolean();
      const result = builder.parse(0, ["-v"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe(true);
    });
  });

  describe("NumberFlagBuilder", () => {
    test("should convert string to number", () => {
      const builder = FlagBuilder.create("--port").number();
      const result = builder.parse(0, ["--port", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe(8080);
      expect(typeof result?.value).toBe("number");
    });

    test("should convert inline value to number", () => {
      const builder = FlagBuilder.create("-p").number();
      const result = builder.parse(0, ["-p=3000"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe(3000);
    });

    test("should handle negative numbers", () => {
      const builder = FlagBuilder.create("--delta").number();
      const result = builder.parse(0, ["--delta", "-5"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe(-5);
    });

    test("should handle negative numbers with inline syntax", () => {
      const builder = FlagBuilder.create("-d").number();
      const result = builder.parse(0, ["-d=-10"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe(-10);
    });

    describe("Validators", () => {
      test("should validate gt (greater than)", () => {
        const builder = FlagBuilder.create("--port").number().gt(1000);
        const resultPass = builder.parse(0, ["--port", "8080"]);
        const resultFail = builder.parse(0, ["--port", "500"]);
        
        expect(resultPass).not.toBeNull();
        expect(resultPass?.value).toBe(8080);
        expect(resultFail).toBeNull();
      });

      test("should validate gte (greater than or equal)", () => {
        const builder = FlagBuilder.create("--port").number().gte(1);
        const resultPass = builder.parse(0, ["--port", "1"]);
        const resultFail = builder.parse(0, ["--port", "0"]);
        
        expect(resultPass).not.toBeNull();
        expect(resultFail).toBeNull();
      });

      test("should validate lt (less than)", () => {
        const builder = FlagBuilder.create("--port").number().lt(65536);
        const resultPass = builder.parse(0, ["--port", "8080"]);
        const resultFail = builder.parse(0, ["--port", "70000"]);
        
        expect(resultPass).not.toBeNull();
        expect(resultFail).toBeNull();
      });

      test("should validate lte (less than or equal)", () => {
        const builder = FlagBuilder.create("--port").number().lte(65535);
        const resultPass = builder.parse(0, ["--port", "65535"]);
        const resultFail = builder.parse(0, ["--port", "65536"]);
        
        expect(resultPass).not.toBeNull();
        expect(resultFail).toBeNull();
      });

      test("should validate multipleOf", () => {
        const builder = FlagBuilder.create("--count").number().multipleOf(10);
        const resultPass = builder.parse(0, ["--count", "100"]);
        const resultFail = builder.parse(0, ["--count", "15"]);
        
        expect(resultPass).not.toBeNull();
        expect(resultFail).toBeNull();
      });

      test("should chain multiple validators", () => {
        const builder = FlagBuilder.create("--port").number().gte(1).lte(65535);
        const resultPass = builder.parse(0, ["--port", "8080"]);
        const resultFailLow = builder.parse(0, ["--port", "0"]);
        const resultFailHigh = builder.parse(0, ["--port", "70000"]);
        
        expect(resultPass).not.toBeNull();
        expect(resultFailLow).toBeNull();
        expect(resultFailHigh).toBeNull();
      });
    });
  });

  describe("ListFlagBuilder", () => {
    test("should split comma-separated values", () => {
      const builder = FlagBuilder.create("--tags").list();
      const result = builder.parse(0, ["--tags", "a,b,c"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toEqual(["a", "b", "c"]);
    });

    test("should split inline comma-separated values", () => {
      const builder = FlagBuilder.create("--tags").list();
      const result = builder.parse(0, ["--tags=a,b,c"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toEqual(["a", "b", "c"]);
    });

    test("should use custom separator", () => {
      const builder = FlagBuilder.create("--tags").list(";");
      const result = builder.parse(0, ["--tags", "a;b;c"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toEqual(["a", "b", "c"]);
    });

    test("should accumulate repeated flags", () => {
      const builder = FlagBuilder.create("--tag").list();
      
      const result1 = builder.parse(0, ["--tag", "a"]);
      expect(result1).not.toBeNull();
      expect(result1?.value).toEqual(["a"]);
      
      const result2 = builder.parse(0, ["--tag", "b"], { current: result1?.value });
      expect(result2).not.toBeNull();
      expect(result2?.value).toEqual(["a", "b"]);
    });
  });

  describe("Type composition - number().list()", () => {
    test("should create array of numbers with .number().list()", () => {
      const builder = FlagBuilder.create("--ports").number().list();
      const result = builder.parse(0, ["--ports", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toEqual([8080]);
      expect(Array.isArray(result?.value)).toBe(true);
      expect(typeof result?.value[0]).toBe("number");
    });

    test("should accumulate numbers with .number().list()", () => {
      const builder = FlagBuilder.create("--port").number().list();
      
      const result1 = builder.parse(0, ["--port", "8080"]);
      expect(result1?.value).toEqual([8080]);
      
      const result2 = builder.parse(0, ["--port", "3000"], { current: result1?.value });
      expect(result2?.value).toEqual([8080, 3000]);
    });
  });

  describe("Type composition - list().number()", () => {
    test("should convert list elements to numbers with .list().number()", () => {
      const builder = FlagBuilder.create("--ports").list().number();
      const result = builder.parse(0, ["--ports", "8080,3000,5000"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toEqual([8080, 3000, 5000]);
      expect(Array.isArray(result?.value)).toBe(true);
      expect(typeof result?.value[0]).toBe("number");
    });

    test("should handle single value with .list().number()", () => {
      const builder = FlagBuilder.create("--ports").list().number();
      const result = builder.parse(0, ["--ports", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toEqual([8080]);
    });
  });

  describe("Refiner sugar methods", () => {
    test("should apply match() refiner", () => {
      const builder = FlagBuilder.create("--name").string().match(/^[a-z]+$/);
      const resultPass = builder.parse(0, ["--name", "john"]);
      const resultFail = builder.parse(0, ["--name", "John123"]);
      
      expect(resultPass).not.toBeNull();
      expect(resultFail).toBeNull();
    });

    test("should apply transform() refiner", () => {
      const builder = FlagBuilder.create("--name").string().transform((v: string) => v.toUpperCase());
      const result = builder.parse(0, ["--name", "john"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("JOHN");
    });

    test("should apply notNaN() refiner", () => {
      const builder = FlagBuilder.create("--port").number().notNaN();
      const resultPass = builder.parse(0, ["--port", "8080"]);
      const resultFail = builder.parse(0, ["--port", "abc"]);
      
      expect(resultPass).not.toBeNull();
      expect(resultFail).toBeNull();
    });
  });

  describe("Edge cases", () => {
    test("should handle empty string value", () => {
      const builder = FlagBuilder.create("--key").string();
      const result = builder.parse(0, ["--key", ""]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("");
    });

    test("should handle flag at different index", () => {
      const builder = FlagBuilder.create("--port").string();
      const result = builder.parse(2, ["cmd", "arg", "--port", "8080"]);
      
      expect(result).not.toBeNull();
      expect(result?.value).toBe("8080");
      expect(result?.index).toBe(2);
    });

    test("should return null when parsing beyond array bounds", () => {
      const builder = FlagBuilder.create("--port").string();
      const result = builder.parse(10, ["--port", "8080"]);
      
      expect(result).toBeNull();
    });
  });
});
