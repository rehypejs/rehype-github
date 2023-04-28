/* eslint-env browser */

/**
 * @callback OnResolve
 *   Callback called when resolving.
 * @returns {void}
 *
 * @callback OnSizeSuggestion
 *   Callback called when there’s a new size suggestion for the viewscreen.
 * @param {number} width
 *   Current width.
 * @param {number} height
 *   Preferred height for `width`.
 * @returns {void}
 *   Nothing.
 *
 * @typedef Options
 *   Configuration.
 * @property {OnResolve | null | undefined} onResolve
 *   Callback called when resolving.
 * @property {OnSizeSuggestion | null | undefined} onSizeSuggestion
 *   Callback called on a size suggestion.
 */

import {
  AmbientLight,
  Color,
  DirectionalLight,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  MeshNormalMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three'
import {STLLoader} from 'three/addons/loaders/STLLoader.js'

const stlLoader = new STLLoader()

// Standard quanta of rotation. Roughly about one degree.
// Used by control modes to increment the orbit position.
const orbitIncrement = Math.PI / 180

const gridSize = 16

const center = new Vector3(0, 0, 0)
const centerZ = new Vector3(0, 0, 1)
const negate = new Vector3(-1, -1, -1)

const black = 0x00_00_00
const lightModeBlue = 0x09_69_da
const darkModeBlue = 0x2f_81_f7
const white = 0xff_ff_ff

const gridMaterial = new MeshBasicMaterial({wireframe: true})
const normalMaterial = new MeshNormalMaterial({name: 'normal'})
const solidMaterial = new MeshPhongMaterial({name: 'solid'})
const wireframeMaterial = new MeshPhongMaterial({
  name: 'wireframe',
  wireframe: true
})

const materials = [normalMaterial, solidMaterial, wireframeMaterial]
let shapeMaterial = normalMaterial
const query = '(prefers-color-scheme: dark)'

/**
 * Render 3D geometry in `node`.
 *
 * @param {HTMLElement} node
 *   Node to work in.
 * @param {Options | null | undefined} [options]
 *   Configuration.
 * @returns
 *   Actions.
 */
export function create(node, options) {
  const scene = new Scene()
  const renderer = new WebGLRenderer({antialias: true})
  const camera = new PerspectiveCamera()
  const light = new DirectionalLight(white)
  const shape = new Mesh(undefined, shapeMaterial)
  const grid = new Mesh(undefined, gridMaterial)

  let spin = 0.3
  let previousX = 0
  let previousY = 0

  const observer = new ResizeObserver(onresize)

  const buttons = materials.map((d) => {
    const button = document.createElement('button')
    button.textContent = d.name
    button.disabled = d === shapeMaterial
    button.addEventListener('click', onclick)
    return button
  })

  const panel = document.createElement('div')

  scene.background = new Color(white)
  scene.add(camera, light, new AmbientLight(white), grid, shape)

  // To do: use d3 to zoom and such, just like in mermaid.
  renderer.domElement.addEventListener('wheel', onwheel)
  renderer.domElement.addEventListener('mousedown', onmousedown)
  renderer.domElement.addEventListener('mousemove', onmousemove)
  renderer.domElement.addEventListener('mouseup', onmouseup)

  panel.classList.add('panel')
  panel.append(...buttons)
  node.append(renderer.domElement, panel)
  observer.observe(node)

  ondarkmode(window.matchMedia(query).matches)
  requestAnimationFrame(main)

  window
    .matchMedia(query)
    .addEventListener('change', (event) => ondarkmode(event.matches))

  return {change}

  /**
   * Change the geometry.
   *
   * @param {string} data
   */
  function change(data) {
    const geometry = stlLoader.parse(data)
    geometry.computeBoundingSphere()
    geometry.computeBoundingBox()
    const sphere = geometry.boundingSphere
    if (!sphere) throw new Error('Impossible')
    const bounds = geometry.boundingBox
    if (!bounds) throw new Error('Impossible')

    const center = bounds.getCenter(negate).negate()
    const min = bounds.min.negate()
    geometry.applyMatrix4(
      new Matrix4().makeTranslation(center.x, center.y, min.z)
    )

    // Change shape.
    shape.geometry = geometry

    // Change grid.
    const segments = Math.ceil((3 * sphere.radius) / gridSize)
    const size = gridSize * segments
    grid.geometry = new PlaneGeometry(size, size, segments, segments)

    // Center.
    const distance = sphere.radius * 5
    camera.position.set(0, (distance / 2) * -1, distance)

    if (options && options.onResolve) options.onResolve()
    onresize([], observer)
  }

  /**
   * Rerender.
   */
  function main() {
    if (spin) {
      move((orbitIncrement / 2) * spin, 0)
      // Spin faster.
      if (spin < 0.5) spin *= 1.01
    }

    light.position.set(camera.position.x, camera.position.y, camera.position.z)
    renderer.render(scene, camera)

    requestAnimationFrame(main)
  }

  /**
   * Move around.
   *
   * @param {number} angleX
   * @param {number} angleY
   */
  function move(angleX, angleY) {
    const axisY = camera.position.clone().cross(camera.up).normalize()
    camera.position.applyAxisAngle(centerZ, angleX)
    camera.position.applyAxisAngle(axisY, angleY)
    camera.up.applyAxisAngle(centerZ, angleX)
    camera.up.applyAxisAngle(axisY, angleY)
    camera.lookAt(center)
  }

  /**
   * Handle a resize from an observer.
   *
   * Also supports being called with `[]` for `entries` to force this behavior.
   *
   * @type {ResizeObserverCallback}
   */
  function onresize(entries) {
    const entry = entries[0]
    const rect = entry ? entry.contentRect : node.getBoundingClientRect()

    camera.aspect = rect.width / rect.height
    camera.updateProjectionMatrix()
    renderer.setSize(rect.width, rect.height)

    if (options && options.onSizeSuggestion) {
      return options.onSizeSuggestion(rect.width, rect.height)
    }
  }

  /**
   * Handle a dark mode media query change.
   *
   * @param {boolean} darkMode
   */
  function ondarkmode(darkMode) {
    gridMaterial.color = new Color(darkMode ? white : black)
    wireframeMaterial.color = new Color(darkMode ? darkModeBlue : lightModeBlue)
    solidMaterial.color = new Color(darkMode ? darkModeBlue : lightModeBlue)
    scene.background = new Color(darkMode ? black : white)
  }

  /**
   * Handle `mousedown` event, start of drag, by stopping spinning.
   *
   * @param {MouseEvent} event
   */
  function onmousedown(event) {
    event.preventDefault()
    spin = 0
    previousX = event.clientX
    previousY = event.clientY
  }

  /**
   * Handle `mousemove` event, representing a drag, by moving the camera.
   *
   * @param {MouseEvent} event
   */
  function onmousemove(event) {
    if (spin) return
    move(
      -1 * orbitIncrement * 0.4 * (event.clientX - previousX),
      orbitIncrement * 0.4 * (event.clientY - previousY)
    )
    previousX = event.clientX
    previousY = event.clientY
  }

  /**
   * Handle `mouseup` event, after drag, by starting to spin again.
   */
  function onmouseup() {
    spin = 0.03
  }

  /**
   * Handle `wheel` event to zoom in and out.
   *
   * @param {WheelEvent} event
   */
  function onwheel(event) {
    event.stopPropagation()
    event.preventDefault()
    camera.position.sub(center)
    camera.position.multiplyScalar(1 + event.deltaY / 1000)
    camera.position.add(center)
    camera.lookAt(center)
    spin = 0.03
  }

  /**
   * Handle click on a button by toggling style.
   *
   * @param {MouseEvent} event
   */
  function onclick(event) {
    const target = /** @type {HTMLButtonElement} */ (event.target)

    for (const d of buttons) {
      d.disabled = d === target
    }

    for (const d of materials) {
      if (d.name === target.textContent) {
        shapeMaterial = d
        shape.material = d
      }
    }
  }
}
