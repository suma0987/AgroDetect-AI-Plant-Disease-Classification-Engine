// monitoring/metrics.js
const promClient = require('prom-client');
const responseTime = require('response-time');

// Create a Registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({ register });

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
});

const activeScans = new promClient.Gauge({
    name: 'active_scans_total',
    help: 'Total number of active scans'
});

const diseaseDetections = new promClient.Counter({
    name: 'disease_detections_total',
    help: 'Total number of disease detections',
    labelNames: ['disease_type']
});

register.registerMetric(httpRequestDuration);
register.registerMetric(activeScans);
register.registerMetric(diseaseDetections);

// Middleware to track request duration
const metricsMiddleware = responseTime((req, res, time) => {
    httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .observe(time / 1000);
});

// Metrics endpoint
app.get('/metrics', async (req, res) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
});

module.exports = {
    metricsMiddleware,
    activeScans,
    diseaseDetections
};