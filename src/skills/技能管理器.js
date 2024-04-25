import _ from 'lodash';
import * as debug from '../debug.js';
import skillConfigs from './技能信息/skillConfigs.js';
import 技能 from './技能.js';

let skills = {};

const initialize = () => {
  debug.log('技能管理器初始化');
  skills = {};
  _.forEach(skillConfigs, (config, key) => {
    const skill = new 技能(config);
    skills[key] = skill;
  });
};

const getSkills = () => skills;

const getSkill = (key) => {
  if (key == null) {
    return null;
  }
  return skills[key];
};

export { initialize, getSkills, getSkill };
