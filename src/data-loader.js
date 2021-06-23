import { map } from './lib/utils/utils.js';
import Cube from './lib/elements/cube.js'
import {
  planetData
} from './data.js';

const data = new Array();
{
  for(let i = 0; i < planetData.data.length; i++) {
    let value = planetData.data[i];
    data.push(
      {
        'name': value.Planet,
        'distance': map(value['Distance from Sun'], 0, 1),
        'radius': (value.Diameter / 2) / (12756 / 2),
        'axisTilt': parseFloat(value['Obliquity to Orbit']),
        'orbPeriod': parseFloat(value['Orbital Period'].slice(0, -7)),
        'rotPeriod': parseFloat(value['Rotation Period'].slice(0, -8) / 24),
        'sphere': null // Actual reference to the sphere
      }
    );
  }
}

export {
  data
};