<!-- Temperature Converter - Chromium extension to convert temperature units. -->
<!-- Copyright (C) 2026 Grace Smith, Alexey Ayzin, -->
<!-- Susan Thao, Aleksandr Nuzhnyi -->

<!-- This program is free software: you can redistribute it and/or modify -->
<!-- it under the terms of the GNU General Public License as published by -->
<!-- the Free Software Foundation, either version 3 of the License, or -->
<!-- (at your option) any later version. -->

<!-- This program is distributed in the hope that it will be useful, -->
<!-- but WITHOUT ANY WARRANTY; without even the implied warranty of -->
<!-- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the -->
<!-- GNU General Public License for more details. -->

<!-- You should have received a copy of the GNU General Public License -->
<!-- along with this program. If not, see <https://www.gnu.org/licenses/>. -->

<!-- Contact and attribution information is in NOTICE. -->

# Presenting temperature-converter

## What does our extension do?
Our extension detects temperatures displayed in text on a webpage and converts from Fahrenheit to Celsius and from Celsius to Fahrenheit.

## How did we program it?
I (Grace) added text highlighting to make it easier to spot the temperature conversion changing on the page. In the beginning, there was a small issue where the highlighting remained on the page even after toggling off the extension, but after editing the JavaScript file that managed the toggling, I was able to make sure that there was only text highlighting when the extension was toggled on.

## How did we communicate?
We mainly communicated through email and Zoom meetings.

## Does it work?
It mostly works if the temperature is listed as text in HTML, but there may be some issues if the temperature text cannot be identified through our scripts in the DOM or the temperature is part of an image, etc.  

[Working Example 1](https://en.wikipedia.org/wiki/Temperature)  
[Working Example 2](https://www.weather.gov/okx/)  
[Broken Example](https://weather.com/)  

## What would we do differently?
I (Grace) would add feature that allows users to select a specific temperature displayed on a webpage to highlight and convert instead of automatically converting every single temperature that is displayed on the webpage.

## Should this project keep going?
