# jspsych-waitfor-function

This plugin executes a specified function and displays a spinning wheel while waiting for the function to complete.
This allows the experimenter to run arbitrary code at any point during the experiment.

The function cannot take any arguments. If arguments are needed, then an anonymous function should be used to wrap the function call (see examples below).

This plugin is based on [jspsych-call-function](https://www.jspsych.org/plugins/jspsych-call-function/).

## Parameters

Parameters with a default value of *undefined* must be specified. Other parameters can be left unspecified if the default value is acceptable.

Parameter    | Type     | Default Value | Description
-------------|----------|---------------|------------
func         | function | *undefined*   | The function to call. See the `async` argument for details.
async        | boolean  | `false`       | If set to true, `func` will be executed asynchoronously. In that case, the first argument passed to `func` is a callback that jsPsych will pass to it, and that you need to call when the async operation is complete. This callback can receive data as argument, that will be added to the trial's data. See example below.
min_duration | int      | 0             | The spinner will be displayed *at least* this time. Value in milliseconds.

## Data Generated

In addition to the [default data collected by all plugins](https://www.jspsych.org/plugins/overview/#data-collected-by-plugins), this plugin collects the following data for each trial.

Name | Type | Value
-----|------|------
value | any | The return value of the called function.

## Dependencies

The spinner is currently using Semantic UI's [loader](https://semantic-ui.com/elements/loader.html), so you need to add the related CSS (and its dependencies) to your page, or the whole Semantic CSS.

## Examples

### Async function call

When doing an asynchronous function call, the function needs to take a argument that will be a callback function (called `done` in the example below),
and you need to execute that callback when the function is done doing its work:

```javascript
var trial = {
    type: 'call-function',
    async: true,
    func: function(done){
        // can perform async operations here like
        // creating an XMLHttpRequest to communicate
        // with a server
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var response_data = xhttp.responseText;
                // line below is what causes jsPsych to 
                // continue to next trial. response_data
                // will be stored in jsPsych data object.
                done(response_data);
            }
        };
        xhttp.open("GET", "path_to_server_script.php", true);
        xhttp.send();
    }
}
```
