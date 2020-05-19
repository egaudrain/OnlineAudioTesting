# jspsych-waitfor-function

This plugin executes a specified function and displays a spinning wheel while waiting for the function to complete.
This allows the experimenter to run arbitrary code at any point during the experiment.

The function cannot take any arguments. If arguments are needed, then an anonymous function should be used to wrap the function call (see examples below).

This plugin is based on [jspsych-call-function](https://www.jspsych.org/plugins/jspsych-call-function/).

## Parameters

Parameters with a default value of *undefined* must be specified. Other parameters can be left unspecified if the default value is acceptable.

Parameter    | Type     | Default Value | Description
-------------|----------|---------------|------------
func         | function | *undefined*   | The function to call.
async        | boolean  | `false`       | Set to true if `func` is an asynchoronous function. If this is true, then the first argument passed to `func` will be a callback that you should call when the async operation is complete. You can pass data to the callback. See example below.
min_duration | int      | 0             | The spinner will be displayed *at least* this time. Value in milliseconds.

## Data Generated

In addition to the [default data collected by all plugins](https://www.jspsych.org/plugins/overview/#data-collected-by-plugins), this plugin collects the following data for each trial.

Name | Type | Value
-----|------|------
value | any | The return value of the called function.

## Dependencies

The spinner is currently using Semantic UI's [loader](https://semantic-ui.com/elements/loader.html), so you need to add the related CSS (and its dependencies) to your page, or the whole Semantic CSS.
