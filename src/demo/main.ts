import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import buildRoomFromRoomML from '../roomml/buildRoom'

const app = document.getElementById('app') as HTMLDivElement
const statusEl = document.getElementById('status') as HTMLDivElement
const fileInput = document.getElementById('fileInput') as HTMLInputElement

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(window.devicePixelRatio)
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x0f1115, 1)
app.appendChild(renderer.domElement)

const scene = new THREE.Scene()
scene.background = new THREE.Color(0x101218)

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true

scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1))
const dirLight = new THREE.DirectionalLight(0xffffff, 0.6)
dirLight.position.set(5, 10, 7)
scene.add(dirLight)

let roomGroup: THREE.Group | null = null

function setStatus(message: string, isError = false) {
  statusEl.textContent = message
  statusEl.classList.toggle('error', isError)
}

function frameCameraToObject(obj: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(obj)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  const maxDim = Math.max(size.x, size.y, size.z)
  const distance = maxDim * 1.8

  camera.position.set(center.x + distance, center.y + distance, center.z + distance)
  controls.target.copy(center)
  controls.update()
}

function buildRoom(text: string) {
  if (roomGroup) {
    scene.remove(roomGroup)
  }
  const group = buildRoomFromRoomML(text)
  roomGroup = group
  scene.add(group)
  frameCameraToObject(group)
}

async function loadSample() {
  try {
    const res = await fetch('/samples/sample.roomml')
    const content = await res.text()
    buildRoom(content)
    setStatus('Loaded sample.roomml')
  } catch (err) {
    console.error(err)
    setStatus('Failed to load sample.roomml', true)
  }
}

fileInput.addEventListener('change', (event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = () => {
    try {
      const text = String(reader.result)
      buildRoom(text)
      setStatus(`Loaded ${file.name}`)
    } catch (err) {
      console.error(err)
      setStatus((err as Error).message, true)
    }
  }
  reader.onerror = () => {
    setStatus('Failed to read file', true)
  }
  reader.readAsText(file)
})

function animate() {
  requestAnimationFrame(animate)
  controls.update()
  renderer.render(scene, camera)
}

window.addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
})

loadSample()
animate()
