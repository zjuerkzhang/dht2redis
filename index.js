var sensor = require('node-dht-sensor');
var config = require('config');
var redis = require('redis');


function Measurer()
{
    if (config.sensor === undefined || config.sensor.gpio_pin === undefined || config.sensor.type === undefined) {
        console.log('Invalid configuration!');
        return undefined;
    }

    this.sensor_type = config.sensor.type;
    this.gpio_pin = config.sensor.gpio_pin;
    this.period = config.period === undefined ? 30*60*1000 : config.period;
}

Measurer.prototype.performMeasurement = function() {
    sensor.read(this.sensor_type, this.gpio_pin, function(err, temperature, humidity) {
    if (!err) {
        var now = new Date();
        var timeStr = now.toLocaleTimeString().split(':').slice(0, 2).join(':');
        var temperatureStr = temperature.toFixed(1);
        var humidityStr = humidity.toFixed(1);
        console.log('temp: ' + temperatureStr + '°C, ' +
            'humidity: ' + humidityStr + '%'
        );
        var client = redis.createClient();
        client.on("error", function(err) {
            console.log("Redis Error " + err);
        })
        client.on("ready", function(res) {
            console.log("Redis ready.");
            client.hset("temperature:" + now.toLocaleDateString(),
                timeStr, temperatureStr);
            client.hset("humidity:" + now.toLocaleDateString(),
                timeStr, humidityStr);
            client.quit();
        });
    }
    else {
        console.log('Measurement Failed: <' + err.toString() + '>');
    }
});
}

var measurer = new Measurer();

if (measurer === undefined) {
    console.log('Instantition failed!');
}

measurer.performMeasurement();
setInterval(measurer.performMeasurement.bind(measurer), measurer.period);

