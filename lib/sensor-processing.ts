/**
 * NeuroSense Signal Processing
 * - Kalman filter for noise reduction (Q=0.01, R=0.1)
 * - Composite stress index: 0.4*GSR + 0.3*sound + 0.3*accel
 * - Alert detection: overstimulation >0.7 for sustained periods
 */

// Kalman filter state per device (in-memory, resets on cold start)
const kalmanStates: Record<string, { estimate: number; errorCovariance: number }> = {}

const KALMAN_Q = 0.01 // Process noise
const KALMAN_R = 0.1  // Measurement noise

export function kalmanFilter(deviceId: string, measurement: number): number {
  if (!kalmanStates[deviceId]) {
    kalmanStates[deviceId] = { estimate: measurement, errorCovariance: 1 }
  }

  const state = kalmanStates[deviceId]

  // Predict
  const predictedEstimate = state.estimate
  const predictedError = state.errorCovariance + KALMAN_Q

  // Update
  const kalmanGain = predictedError / (predictedError + KALMAN_R)
  state.estimate = predictedEstimate + kalmanGain * (measurement - predictedEstimate)
  state.errorCovariance = (1 - kalmanGain) * predictedError

  return state.estimate
}

export function normalizeGSR(raw: number): number {
  // GSR typically 0-1023 from ADC, normalize to 0-1
  return Math.max(0, Math.min(1, raw))
}

export function normalizeSound(raw: number): number {
  // Sound levels, normalize to 0-1 (0-255 range from Micro:bit)
  return Math.max(0, Math.min(1, raw / 255))
}

export function normalizeAccel(x: number, y: number, z: number): number {
  // Magnitude of acceleration vector, normalized
  const magnitude = Math.sqrt(x * x + y * y + z * z)
  // Micro:bit accel is in mg (1g = 1024mg), normalize around 1g baseline
  // Values above 2g (2048mg) are significant movement
  return Math.max(0, Math.min(1, (magnitude - 1024) / 2048))
}

export function computeStressIndex(
  gsrNorm: number,
  soundNorm: number,
  accelNorm: number
): number {
  // Composite stress index: 0.4*GSR + 0.3*sound + 0.3*accel
  const raw = 0.4 * gsrNorm + 0.3 * soundNorm + 0.3 * accelNorm
  return Math.round(raw * 1000) / 1000
}

export type AlertType = 'overstimulation' | 'high_movement' | 'sound_spike' | 'rapid_change'
export type Severity = 'low' | 'medium' | 'high'

export interface AlertInfo {
  type: AlertType
  severity: Severity
  message: string
}

export function detectAlerts(
  stressIndex: number,
  gsrNorm: number,
  soundNorm: number,
  accelNorm: number
): AlertInfo[] {
  const alerts: AlertInfo[] = []

  // Overstimulation: stress index > 0.7
  if (stressIndex > 0.85) {
    alerts.push({
      type: 'overstimulation',
      severity: 'high',
      message: `Nivel de estres critico detectado (${(stressIndex * 100).toFixed(0)}%). Se recomienda intervencion inmediata.`,
    })
  } else if (stressIndex > 0.7) {
    alerts.push({
      type: 'overstimulation',
      severity: 'medium',
      message: `Sobreestimulacion detectada (${(stressIndex * 100).toFixed(0)}%). Considere reducir estimulos del entorno.`,
    })
  }

  // High movement: accel > 0.7 (significant involuntary movement)
  if (accelNorm > 0.7) {
    alerts.push({
      type: 'high_movement',
      severity: accelNorm > 0.85 ? 'high' : 'medium',
      message: `Movimiento elevado detectado. Posible agitacion motora.`,
    })
  }

  // Sound spike: > 0.8 (loud environment, >70dB equivalent)
  if (soundNorm > 0.8) {
    alerts.push({
      type: 'sound_spike',
      severity: soundNorm > 0.9 ? 'high' : 'medium',
      message: `Pico de sonido ambiental detectado. Nivel alto de ruido en el entorno.`,
    })
  }

  return alerts
}
