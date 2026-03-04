import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-success/10">
            <MailCheck className="h-7 w-7 text-success" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Revisa tu correo</CardTitle>
          <CardDescription className="text-muted-foreground">
            Te enviamos un enlace de confirmacion. Haz clic en el para activar tu cuenta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Volver al inicio de sesion</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
