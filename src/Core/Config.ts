import {Vector3} from 'three'


export const Config = {
  camera: {
    fov: 40,
    near: .1,
    far: 100,
    position: new Vector3(10, 38, 0),
    lookAt: new Vector3(-8, 0, 0),
    move: {
      minX: 4,
      maxX: 18,
      minZ: -10,
      maxZ: 10,
      speed: .06,
    },
  },

  fog: {
    near: 38,
    far: 60,
    color: '#ceffb8',
  },

  assets: [
    {url: '/assets/gltf/ground.glb', type: 'model', name: 'farmMain', loader: 'gltf'},
    {url: '/assets/gltf/objects.glb', type: 'model', name: 'objects', loader: 'gltf'},

    {url: '/assets/images/farm-entities/chicken.png', type: 'texture', name: 'chicken', loader: 'pixi'},
    {url: '/assets/images/farm-entities/corn.png', type: 'texture', name: 'corn', loader: 'pixi'},
    {url: '/assets/images/farm-entities/cow.png', type: 'texture', name: 'cow', loader: 'pixi'},
    {url: '/assets/images/farm-entities/grape.png', type: 'texture', name: 'grape', loader: 'pixi'},
    {url: '/assets/images/farm-entities/sheep.png', type: 'texture', name: 'sheep', loader: 'pixi'},
    {url: '/assets/images/farm-entities/strawberry.png', type: 'texture', name: 'strawberry', loader: 'pixi'},
    {url: '/assets/images/farm-entities/tomato.png', type: 'texture', name: 'tomato', loader: 'pixi'},

    {url: '/assets/images/money.png', type: 'texture', name: 'money', loader: 'pixi'},
    {url: '/assets/images/water.png', type: 'texture', name: 'water', loader: 'pixi'},
    {url: '/assets/images/feed.png', type: 'texture', name: 'feed', loader: 'pixi'},
    {url: '/assets/images/dark_mode.png', type: 'texture', name: 'darkMode', loader: 'pixi'},
    {url: '/assets/images/light_mode.png', type: 'texture', name: 'lightMode', loader: 'pixi'},
    {url: '/assets/images/smoke.png', type: 'texture', name: 'smoke', loader: 'pixi'},
    {url: '/assets/images/hand.png', type: 'texture', name: 'hand', loader: 'pixi'},
  ],

  ground: {
    position: new Vector3(0, 0, 0),
  },

  lights: {
    day: {
      hemisphere: {
        skyColor: '#ffffff',
        groundColor: '#b5b5b5',
        intensity: .6,
      },
      directional: {
        color: '#fff4d6',
        intensity: 3.5,
        position: new Vector3(30, 60, 20),
      },
    },
    night: {
      hemisphere: {
        color: '#ffffff',
        intensity: .15,
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
      corn: 4,
      tomato: 4,
      strawberry: 4,
      grape: 4,

      chicken: 6,
      sheep: 6,
      cow: 6,
    },
  },
} as const