import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Timer, AlertCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useState, useEffect } from 'react'

export default function ObservationRoomDetailPage() {
    const navigate = useNavigate()
    const { id } = useParams()
    const [timeLeft, setTimeLeft] = useState(12 * 3600) // 12h in seconds

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(prev => (prev > 0 ? prev - 1 : 0))
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    const hoursLeft = Math.floor(timeLeft / 3600)
    const minutesLeft = Math.floor((timeLeft % 3600) / 60)
    const secondsLeft = timeLeft % 60

    const isAlert = hoursLeft <= 2 // Alerta a las 10h (quedan 2h)
    const isLimit = hoursLeft === 0 && minutesLeft === 0 && secondsLeft === 0

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-2xl font-bold">Detalle de Camilla #{id}</h1>
            </div>

            <Card className={isAlert ? 'border-red-500 bg-red-50' : ''}>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Timer className={isAlert ? 'text-red-500' : 'text-primary'} />
                        Tiempo Restante de Observación
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-5xl font-mono font-bold text-center py-4">
                        {String(hoursLeft).padStart(2, '0')}:{String(minutesLeft).padStart(2, '0')}:{String(secondsLeft).padStart(2, '0')}
                    </div>
                    <Progress value={(timeLeft / (12 * 3600)) * 100} className="h-4" />

                    {isAlert && !isLimit && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-100 p-3 rounded-lg font-bold">
                            <AlertCircle className="h-5 w-5" />
                            ALERTA: El paciente ha superado las 10 horas en observación.
                        </div>
                    )}
                    {isLimit && (
                        <div className="flex items-center gap-2 text-red-700 bg-red-200 p-3 rounded-lg font-black uppercase text-center justify-center">
                            LÍMITE DE 12 HORAS ALCANZADO
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
