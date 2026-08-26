/** Testing utilities for data-driven test patterns */
import path from 'path'
import { expect, it } from 'vitest'

/** Converts a filename to a module describe() */
export const toModule = (file: string) => {
	return path.relative(process.cwd(), file)
		.replace(/\.test\.[tj]s$/, '')
}

export type TestCase<I = any, O = any> = {
	desc: string;
	input: I
} & (
	| { expected: O; throws?: never }
	| { throws: string; expected?: never }
)

export type FnTestCase<Fn extends (...args: any[]) => any> =
	Parameters<Fn> extends [infer SingleArg] | [infer SingleArg | undefined]
		? TestCase<SingleArg, ReturnType<Fn>>
		: TestCase<Parameters<Fn>, ReturnType<Fn>>

export type FnMatchTestCase<Fn extends (...args: any[]) => any> =
	Parameters<Fn> extends [infer SingleArg] | [infer SingleArg | undefined]
		? TestCase<SingleArg, Partial<ReturnType<Fn>>>
		: TestCase<Parameters<Fn>, Partial<ReturnType<Fn>>>

export type FnSingleTestCase<Fn extends (...args: any[]) => any> =
	TestCase<Parameters<Fn>[0], ReturnType<Fn>>

/** Run data-driven cases against a function; case types inferred from `fn`. */
export const runTestCases = <Fn extends (...args: any[]) => any>(fn: Fn, cases: FnTestCase<Fn>[]): void => {
	cases.forEach((testCase) => {
		it(`should handle ${testCase.desc}`, () => {
			if ('throws' in testCase) {
				expect(() => invokeFn(fn, testCase)).toThrow(testCase.throws)
			} else {
				expect(invokeFn(fn, testCase)).toEqual(testCase.expected)
			}
		})
	})
}

/** Like runTestCases but asserts with toMatchObject; expected is Partial<return>. */
export const matchTestCases = <Fn extends (...args: any[]) => any>(fn: Fn, cases: FnMatchTestCase<Fn>[]): void => {
	cases.forEach((testCase) => {
		it(`should match ${testCase.desc}`, () => {
			if ('throws' in testCase) {
				expect(() => invokeFn(fn, testCase)).toThrow(testCase.throws)
			} else {
				expect(invokeFn(fn, testCase)).toMatchObject(testCase.expected)
			}
		})
	})
}

const invokeFn = <Fn extends (...args: any[]) => any>(fn: Fn, testCase: { input: FnTestCase<Fn>['input'] }): ReturnType<Fn> => {
	const { input } = testCase
	if (fn.length > 1 && Array.isArray(input)) {
		return fn(...(input as Parameters<Fn>))
	}
	return fn(input as Parameters<Fn>[0])
}
