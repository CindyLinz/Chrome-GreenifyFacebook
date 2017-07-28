function each(arr, act){
  var i;
  for(i=0; i<arr.length; ++i)
    act(arr[i], i);
}

function rgb2hsv(_rgb){
  var rgb = [];
  var M = 0;
  var m = 1;
  var i;
  for(i=0; i<3; ++i){
    rgb[i] = _rgb[i] / 255;
    if( rgb[i] < m ) m = rgb[i];
    if( rgb[i] > M ) M = rgb[i];
  }
  var c = M - m;
  var h, hh;
  if( c == 0 )
    hh = 0;
  else if( M == rgb[0] )
    hh = (rgb[1]-rgb[2]) / c % 6;
  else if( M == rgb[1] )
    hh = (rgb[2]-rgb[0]) / c + 2;
  else
    hh = (rgb[0]-rgb[1]) / c + 4;
  h = hh / 6;
  var v = M;
  var s;
  if( v == 0 )
    s = 0;
  else
    s = c / v;
  return [h, s, v];
};

function hsv2rgb(h, s, v){
  var c = v * s;
  var m = v - c;
  var hh = h*6;
  var x = c * (1 - Math.abs(hh % 2 - 1));
  var r, g, b;
  if( hh < 1 )
    r=c, g=x, b=0;
  else if( hh < 2 )
    r=x, g=c, b=0;
  else if( hh < 3 )
    r=0, g=c, b=x;
  else if( hh < 4 )
    r=0, g=x, b=c;
  else if( hh < 5 )
    r=x, g=0, b=c;
  else
    r=c, g=0, b=x;
  r += m;
  g += m;
  b += m;
  return [r*255|0,g*255|0,b*255|0];
};

function greenify(style, name){
  var value = style.getPropertyValue(name);
  if( !value )
    return;
  var match = value.match(/rgba?\s*\((\d+\.?\d*)\s*,\s*(\d+\.?\d*)\s*,\s*(\d+\.?\d*)/);
  if( match ){
    match.shift();
    var hsv = rgb2hsv(match);
    if( .45 < hsv[0] && hsv[0] < .75 ){
      var rgb = hsv2rgb(hsv[0]-.3, hsv[1], hsv[2]);
      var value2 = value.replace(/(rgba?\s*\()(\d+\.?\d*)(\s*,\s*)(\d+\.?\d*)(\s*,\s*)(\d+\.?\d*)/, '$1' + rgb[0] + '$3' + rgb[1] + '$5' + rgb[2]);
      //console.warn(value, match, JSON.stringify(hsv), rgb, value2);
      style.setProperty(name, value2);
    }
  }

  if( value.match(/uL7V6OUUkIM/) )
    style.setProperty(name, 'url(' + chrome.runtime.getURL('emotion.png') + ')');
  if( value.match(/2CZiT44LtsO/) )
    style.setProperty(name, 'url(' + chrome.runtime.getURL('sign.png') + ')');
  if( value.match(/ux2RLcXFr3U/) )
    style.setProperty(name, 'url(' + chrome.runtime.getURL('menu.png') + ')');
  if( value.match(/YkzZIp8bp1V/) )
    style.setProperty(name, 'url(' + chrome.runtime.getURL('tag.png') + ')');
  if( value.match(/-vhShBXn2pa/) )
    style.setProperty(name, 'url(' + chrome.runtime.getURL('big-sign.png') + ')');
}

each(document.styleSheets, function(sheet){
  each(sheet.cssRules || sheet.rules || [], function(rule){
    if( rule.style ){
      greenify(rule.style, 'background-color');
      greenify(rule.style, 'color');
      greenify(rule.style, 'border-color');
      greenify(rule.style, 'background-image');
    }
  });
});
