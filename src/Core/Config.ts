import {Vector3} from 'three'


export const Config = {
  camera: {
    fov: 75,
    near: .1,
    far: 100,
    position: new Vector3(10, 25, 0),
    lookAt: new Vector3(0, 0, 0),
    move: {
      minX: -2,
      maxX: 10,
      minZ: -8,
      maxZ: 8,
      speed: .06,
    },
  },

  assets: [
    {url: 'assets/gltf/ground.glb', type: 'model', name: 'farmMain', loader: 'gltf'},
    {url: 'assets/gltf/objects.glb', type: 'model', name: 'objects', loader: 'gltf'},
  ],

  ground: {
    position: new Vector3(0, 0, 0),
  },

  lights: {
    day: {
      ambient: {
        color: '#ffffff',
        intensity: 1,
      },
      directional: {
        color: '#fff',
        intensity: 25,
        position: new Vector3(10, 35, 20),
      },
    },
    night: {
      ambient: {
        color: '#ffffff',
        intensity: 1,
      },
      directional: {
        color: '#fff',
        intensity: 2,
        position: new Vector3(10, 8, 30),
      },
    },
  },

  plots: [
    {
      position: new Vector3(-7, 4.4, 9.4),
      id: 1,
    },
    {
      position: new Vector3(3.5, 4.4, 9.4),
      id: 2,
    },
    {
      position: new Vector3(3.5, 4.4, -7),
      id: 3,
    },
  ],

  startMoney: 100,

  farmEntities: [
    {type: 'corn', name: 'Corn', price: 5, sellPrice: 25},
    {type: 'tomato', name: 'Tomato', price: 7, sellPrice: 35},
    {type: 'strawberry', name: 'Strawberry', price: 12, sellPrice: 60},
    {type: 'grape', name: 'Grape', price: 18, sellPrice: 75},
    {type: 'chicken', name: 'Chicken', price: 35, sellPrice: 100},
    {type: 'sheep', name: 'Sheep', price: 60, sellPrice: 200},
    {type: 'cow', name: 'Cow', price: 120, sellPrice: 450},
  ],

  growth: {
    stages: ['soil', 'small', 'medium', 'ripe'],

    durations: {
      corn: [2, 2, 2],
      tomato: [2, 2, 2],
      strawberry: [2, 2, 2],
      grape: [2, 2, 2],

      chicken: [3, 3, 3],
      sheep: [3, 3, 3],
      cow: [3, 3, 3],
    },
  },
} as const
