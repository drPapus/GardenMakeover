import {TCareAction, TCropBed, TFarmEntity} from '../Entities/Plot'


export const getCareActionByEntity = (entityType: TFarmEntity): TCareAction => {
  const plants: TCropBed[] = ['corn', 'tomato', 'grape', 'strawberry']
  // @ts-ignore TODO
  return plants.includes(entityType) ? 'water' : 'feed'
}