# jspsych-crm

This plugin displays an interface for the Coordinate Response Measure [(Bolia _et al._, 2000)](https://doi.org/10.1121/1.428288). The interface is a grid where
each row corresponds to a color and each column corresponds to a number. The participants hear a sound and then can click on one of the cells to give their response.

The trial can end when the subject responds, when the audio file has finished playing, or if the subject has failed to respond within a fixed length of time.

Note that the buttons are disabled during playing so the subject cannot press any button during that time.

## Parameters

Parameters with a default value of *undefined* must be specified. Other parameters can be left unspecified if the default value is acceptable.

Parameter       | Type             | Default Value | Description
----------------|------------------|---------------|------------
stimulus        | string           | undefined     | The path (url) to the audio file to play.
colors          | array of strings | undefined     | Labels for the rows.
numbers         | array            | undefined     | Labels for the columns (can be strings or plain numbers).
prompt          | string           | null          | This string can contain HTML markup. Any content here will be displayed above the response grid. The intention is that it can be used to provide a reminder about the action the subject is supposed to take.
trial_duration  | numeric          | null          | How long to wait for the subject to make a response before ending the trial in milliseconds. If the subject fails to make a response before this timer is reached, the subject's response will be recorded as null for the trial and the trial will end. If the value of this parameter is null, the trial will wait for a response indefinitely.
response_ends_trial | boolean      | true          | If true, then the trial will end whenever the subject makes a response (assuming they make their response before the cutoff specified by the `trial_duration` parameter).
trial_ends_after_audio | boolean   | false         | If true, then the trial will end as soon as the audio file finishes playing.
visual_feedback | boolean          | false         | If true, provides feedback after the subject gave their answer. Visual feedback automatically ends the trial.
correct         | object           | undefined     | An object containing the correct color and number (used to calculate the score and to provide feedback).
color_values    | object           | null          | An object with keys corresponding to the `colors`, and containing a valid CSS color description. If left to `null`, some default colors are used (see below).
text_color_values | object         | 'auto'        | Same as `color_values` but for the text color of the cells. `'auto'` (the default) means that the text color is either black or white depending on the computed luminance of the background.

Default color values:

```javascript
color_values = {
	red:    "#ff3333",
	blue:   "#6b6bff",
	green:  "#80ee59",
	yellow: "#ffe534",
	pink:   "#ff57df",
	purple: "#a522ff",
	brown:  "#7a5630",
	black:  "#22222",
	white:  "#fcfcfc",
	grey:   "#8c8c8c",
	gray:   "#8c8c8c"
};
```

## Data Generated

In addition to the [default data collected by all plugins](https://www.jspsych.org/plugins/overview/#data-collected-by-plugins), this plugin collects the following data for each trial.

Name     | Type     | Value
---------|----------|------
rt       | numeric  | The response time in milliseconds for the subject to make a response. The time is measured from when the stimulus first appears on the screen until the subject's response.
stimulus | string   | The stimulus that was passed as parameter (just for convenience).
response_color  | string | Indicate which color was selected by the participant. `null` if not response was given.
response_number | string | Indicate which number was selected by the participant. `null` if not response was given.
correct_color   | string | Indicate which color was the correct one (from `trial.correct`).
correct_number  | string | Indicate which number was the correct one (from `trial.correct`).

## Styling elements

### IDs

id                               | Description
---------------------------------|------------------------------------
`jspsych-crm-buttons-container`  | The `<div>` that wraps around the grid and prompt.


### Classes and elements

CSS selectors                              | Description
-------------------------------------------|------------------------------------
table.jspsych-crm                          | The grid containing the CRM buttons.
table.jspsych-crm th                       | The color labels on the sides of each row.
table.jspsych-crm td                       | The cells of the grid.
visual-feedback                            | This class is given to the button that represents the correct option, *after* the subject has given their answer.
correct, incorrect                         | One of these classes is given to the button that represents the correct option, depending on whether the subject's answer was correct or incorrect.
.crm-*%color%*                             | Each element displayed in a color receives a class which is constructed from the name of the color.

## Dependencies

This plugin relies on [jQuery](https://jquery.com/). Note that this is not absolutely necessary, but it makes some things fail silently instead of raising errors. If you need this plugin without jQuery, you can easily
replace the jQuery syntax with standard Javascript DOM manipulation.

The animation of the visual feedback can make use of [Semantic UI's transitions](https://semantic-ui.com/modules/transition.html) ('bounce' for correct, 'shake' for incorrect). But if it's not available a simpler blink animation is implemented within this plugin.
