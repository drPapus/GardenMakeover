import {TCareAction, TCropBed, TFarmEntity} from '../Entities/Plot'


export const getCareActionByEntity = (entityType: TFarmEntity): TCareAction => {
  const plants: TCropBed[] = ['corn', 'tomato', 'grape', 'strawberry']
  // @ts-ignore
  return plants.includes(entityType) ? 'water' : 'feed'
}