// jsdom doesn't implement canvas 2D contexts and logs a noisy warning when
// getContext() is called. Stub it so App's real getContext(null) path is
// exercised without that console noise in every test run.
HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext
