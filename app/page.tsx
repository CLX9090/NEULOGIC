import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Activity, Shield, Bell } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-foreground">NeuroSense</span>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">Iniciar sesion</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/sign-up">Registrarse</Link>
          </Button>
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            Monitoreo sensorial en tiempo real
          </div>
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            Bienestar sensorial para cada nino
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
            NeuroSense conecta dispositivos ESP8266 con sensores GSR, sonido y acelerometro
            para monitorear en tiempo real el estado sensorial de ninos neurodivergentes.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Comenzar ahora</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Ya tengo cuenta</Link>
            </Button>
          </div>
        </div>

        <div className="mx-auto mt-24 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Activity className="h-5 w-5 text-chart-1" />}
            title="Datos en tiempo real"
            description="Visualiza GSR, sonido y movimiento al instante desde el dispositivo del nino."
          />
          <FeatureCard
            icon={<Bell className="h-5 w-5 text-chart-4" />}
            title="Alertas inteligentes"
            description="Recibe notificaciones cuando los niveles de estres superan los umbrales configurados."
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5 text-chart-2" />}
            title="Privacidad primero"
            description="Consentimiento RGPD/COPPA integrado. Los datos solo son accesibles por tutores autorizados."
          />
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
        {icon}
      </div>
      <h3 className="mb-2 font-semibold text-card-foreground">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  )
}
