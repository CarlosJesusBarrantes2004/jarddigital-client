import test from "node:test";
import assert from "node:assert/strict";
import { riskLevel, selectByRisk } from "./churn.utils.ts";

const prediction = (p, level = p >= 0.7 ? "ALTO" : p >= 0.4 ? "MEDIO" : "BAJO") => ({ probabilidad_churn: p, nivel_riesgo: level });

test("classifies the exact business thresholds using probability", () => {
  for (const [p, expected] of [[0, "BAJO"], [0.3999, "BAJO"], [0.4, "MEDIO"], [0.6999, "MEDIO"], [0.7, "ALTO"], [1, "ALTO"]]) {
    assert.equal(riskLevel(prediction(p)), expected);
  }
});

test("missing or invalid predictions never become low-risk clients", () => {
  for (const value of [null, undefined, -1, 1.1, NaN, Infinity, "0.8"]) assert.equal(riskLevel(prediction(value)), null);
  assert.equal(riskLevel(null), null);
  assert.equal(riskLevel(), null);
});

test("filters the entire collection before pagination and sorts highest risk first", () => {
  const rows = Array.from({ length: 60 }, (_, id) => ({ id, prediccion_churn: prediction(id === 59 ? 0.95 : 0.1) }));
  assert.deepEqual(selectByRisk(rows, "ALTO", true).map(row => row.id), [59]);
  assert.equal(selectByRisk(rows, "", true)[0].id, 59);
  assert.equal(rows[0].id, 0, "sorting must preserve the cached source order");
});

test("missing probabilities use zero when sorting and missing predictions are excluded from risk filters", () => {
  const rows = [{ id: 1 }, { id: 2, prediccion_churn: prediction(0) }, { id: 3, prediccion_churn: prediction(0.4) }];
  assert.deepEqual(selectByRisk(rows, "", true).map(row => row.id), [3, 1, 2]);
  assert.deepEqual(selectByRisk(rows, "BAJO", false).map(row => row.id), [2]);
});

test("filters strictly by the API level even when probability indicates another level", () => {
  const rows = [
    { id: 1, prediccion_churn: prediction(0.1, "ALTO") },
    { id: 2, prediccion_churn: prediction(0.9, "MEDIO") },
    { id: 3, prediccion_churn: prediction(0.8, "BAJO") },
    { id: 4, prediccion_churn: prediction(0.95, null) },
    { id: 5, prediccion_churn: null },
  ];
  for (const [level, id] of [["ALTO", 1], ["MEDIO", 2], ["BAJO", 3]]) {
    assert.deepEqual(selectByRisk(rows, level, false).map(row => row.id), [id]);
  }
  assert.deepEqual(selectByRisk(rows, "", false), rows);
});

test("sorts by probability independently of level and restores source order when unchecked", () => {
  const rows = [
    { id: 1, prediccion_churn: prediction(0.4) },
    { id: 2, prediccion_churn: prediction(0.9, null) },
    { id: 3, prediccion_churn: prediction(null, "ALTO") },
    { id: 4, prediccion_churn: prediction(0.7) },
  ];
  assert.deepEqual(selectByRisk(rows, "", true).map(row => row.id), [2, 4, 1, 3]);
  assert.deepEqual(selectByRisk(rows, "", false).map(row => row.id), [1, 2, 3, 4]);
  assert.deepEqual(selectByRisk(rows, "ALTO", true).map(row => row.id), [4, 3]);
  assert.deepEqual(selectByRisk(rows, "ALTO", false).map(row => row.id), [3, 4]);
});
