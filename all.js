// canvas
let canvas = document.querySelector('#stage')
let ctx = canvas.getContext('2d')
canvas.width = 1200
canvas.height = 800

// 物理變數
let time = 0
let count = 0
let gravity = 0.9
// let friction = 0.9
let balls = [] // 煙火發射球會超過一個，用陣列
let particles = [] // 粒子會超過一個，用陣列
let mousePos = { x: 600, y: 400 }

// ----- 煙火產生Function -----
// 產生多個煙火粒子(target參數傳入ball的target位置)
function generateParticles(target) {
  let angle
  let color = `hsl(${count % 360}, 100%, 70%)`
  for (let i = 0; i < 87; i++) {
    angle = Math.random() * Math.PI * 2 // 煙火綻放的隨機角度(圓裡面隨意角度)
    let particle = {
      life: 100, // 生命
      position: {
        x: target.x,
        y: target.y
      },
      velocity: {
        x: 0,
        y: 0
      },
      acceleration: {
        x: Math.cos(angle) * (Math.random() * 20 + 5), // 乘上隨機速度
        y: Math.sin(angle) * (Math.random() * 20 + 5) // 乘上隨機速度
      },
      wh: 10,
      rotate: Math.random() * Math.PI * 2, // 粒子旋轉角度
      color: color
    }
    particles.push(particle)
  }
}

// 煙火粒子物理運動及繪製
function movingParticle(offset) {
  particles.forEach((particle, index) => {
    particle.life-- // 動畫每更新一次，生命就-1
    if (particle.life > 0) {
      // x軸，acceleration可能為負
      particle.velocity.x += particle.acceleration.x
      particle.position.x += particle.velocity.x / 500 * offset
      // y軸，acceleration可能為負
      particle.acceleration.y += gravity // 重力影響
      particle.velocity.y += particle.acceleration.y
      particle.position.y += particle.velocity.y / 500 * offset
      // 繪製煙火粒子
      drawParticle(particle, particle.color)
    } else {
      console.log('delete particles')
      delete particles.splice(index, 1) // 會改變原值，刪除第一個，後面的會往前補上
    }
  })
}

// 繪製"不同角度"的粒子
function drawParticle(particle, color) {
  ctx.fillStyle = color
  ctx.save()
  ctx.translate(particle.position.x + particle.wh / 2, particle.position.y + particle.wh / 2)
  ctx.rotate(particle.rotate)
  ctx.fillRect(- particle.wh / 2, - particle.wh / 2, particle.wh, particle.wh)
  ctx.restore()
}
// ------------

// ----- 煙火發射球產生Function -----
// 產生煙火球
function generateBall(mousePos) {
  // -----發射煙火-----
  // 象限一: distX+、distY-
  // 象限二: distX-、distY-
  // 象限三: distX-、distY+
  // 象限四: distX+、distY+
  let distX = mousePos.x - canvas.width / 2 // x軸距離(臨邊)
  let distY = mousePos.y - canvas.height // y軸距離(對邊)
  let ball = {
    angle: Math.atan(distY / distX), // 角度 = 對邊 / 臨邊
    position: {
      x: canvas.width / 2,
      y: canvas.height
    },
    velocity: 0, // 斜邊發射速度
    acceleration: 30, // 斜邊加速度
    radius: 10,
    active: true,
    target: {
      // 紀錄每個按下去發射煙火球的目標位置
      x: mousePos.x,
      y: mousePos.y
    }
  }
  // 第2、3象限將x軸速度改為"負數"
  if (distX < 0) {
    ball.velocity *= -1
    ball.acceleration *= -1
  }
  // console.log(ball.target)
  balls.push(ball)
}

// 煙火發射球物理運動及繪製
function movingBall(offset) {
  balls.forEach((ball, index) => {
    ball.velocity += ball.acceleration
    ball.position.x += ball.velocity * Math.cos(ball.angle) / 1000 * offset // 計算x軸速度(Math.cos(ball.angle)皆為正數)
    ball.position.y += ball.velocity * Math.sin(ball.angle) / 1000 * offset // 計算y軸速度(往上是負，往下為正)

    // 煙火發射球到目標位置後移除
    if (ball.position.y < ball.target.y) ball.active = false
    if (ball.active == true) {
      drawBall(ball)
    } else {
      console.log('delete ball')
      delete balls.splice(index, 1)
      // 煙火粒子物理運動及繪製，傳入ball.target(滑鼠點擊位置)參數
      generateParticles(ball.target)
    }
  })
}

// 繪製"彩色"煙火發射球
function drawBall(ball) {
  ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`
  ctx.beginPath()
  ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2)
  ctx.fill()
}
// ------------

// RGB瞄準線
function drawLine() {
  ctx.beginPath()
  ctx.moveTo(canvas.width / 2, canvas.height)
  ctx.lineTo(mousePos.x, mousePos.y)
  ctx.lineWidth = 3
  ctx.strokeStyle = `hsla(${count % 360}, 100%, 70%, ${count % 100 / 100 + 0.2})`
  ctx.stroke()
}

// 每次渲染做 motion (負責算座標)，offset => 毫秒差(每次渲染經過的時間(毫秒))
function motion(offset) {
  count++
  // 繪製RGB瞄準線
  drawLine()
  // 煙火發射球物理運動及繪製
  movingBall(offset)
  // 煙火粒子需要不斷渲染，待煙火粒子產生後(generateParticles)，煙火粒子就會出現
  movingParticle(offset)
}

// 渲染畫面
function render(t) {
  ctx.fillStyle = 'rgba(0, 0, 0, .5)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // canvas.width = canvas.width // 若使用這個，不會有殘影
  motion(t - time) // 間隔丟進去
  time = t // time的賦值寫在motion後面，才能相減時計算毫秒差(每次渲染經過的時間(毫秒))
  requestAnimationFrame(render)
}
requestAnimationFrame(render)

// 瞄準線隨鼠標移動
canvas.addEventListener('mousemove', function (e) {
  // 每次移動時紀錄座標
  mousePos = { x: e.offsetX, y: e.offsetY }
})

canvas.addEventListener('click', function (e) {
  // 安全起見，每次點擊時紀錄座標
  mousePos = { x: e.offsetX, y: e.offsetY }
  // 產生煙火球
  generateBall(mousePos)
})