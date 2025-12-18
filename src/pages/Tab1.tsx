import { useState } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonSegment, IonSegmentButton, IonLabel, IonIcon, IonInput,
  IonButton, IonDatetime, IonItem, IonText, useIonToast
} from '@ionic/react';
import { alarmOutline, timerOutline, addOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import { Preferences } from '@capacitor/preferences';
import { LocalNotifications } from '@capacitor/local-notifications';

interface Tarea {
  id: number;
  titulo: string;
  tipo: 'recordatorio' | 'temporizador';
  fechaHora?: string;
  minutos?: number;
  completada: boolean;
}

const Tab1: React.FC = () => {
  const [modo, setModo] = useState<'recordatorio' | 'temporizador'>('recordatorio');
  const [titulo, setTitulo] = useState('');
  const [fechaHora, setFechaHora] = useState('');
  const [minutos, setMinutos] = useState('');
  const [present] = useIonToast();
  const history = useHistory();

  const mostrarToast = (message: string) => {
    present({
      message,
      duration: 2000,
      color: 'primary',
      position: 'top'
    });
  };

  const crearTarea = async () => {
    if (!titulo.trim()) {
      mostrarToast('Escribe un título');
      return;
    }

    if (modo === 'recordatorio' && !fechaHora) {
      mostrarToast('Selecciona fecha y hora');
      return;
    }

    if (modo === 'temporizador' && !minutos) {
      mostrarToast('Ingresa los minutos');
      return;
    }

    const { value } = await Preferences.get({ key: 'tareas' });
    let tareas: Tarea[] = value ? JSON.parse(value) : [];

    const nuevaTarea: Tarea = {
      id: Date.now(),
      titulo: titulo.trim(),
      tipo: modo,
      fechaHora: modo === 'recordatorio' ? fechaHora : undefined,
      minutos: modo === 'temporizador' ? Number(minutos) || 25 : undefined,
      completada: false
    };

    tareas.push(nuevaTarea);
    await Preferences.set({ key: 'tareas', value: JSON.stringify(tareas) });

    // === NOTIFICACIÓN PARA RECORDATORIO ===
    if (modo === 'recordatorio' && nuevaTarea.fechaHora) {
      const timestamp = new Date(nuevaTarea.fechaHora).getTime();
      if (timestamp > Date.now()) {
        // Pedir permiso la primera vez
        const perm = await LocalNotifications.requestPermissions();
        if (perm.display === 'granted') {
          await LocalNotifications.schedule({
            notifications: [
              {
                id: nuevaTarea.id,
                title: '🔔 Neon Focus',
                body: nuevaTarea.titulo,
                schedule: { at: new Date(timestamp) },
                sound: 'default',
                extra: { data: 'whatever' }
              }
            ]
          });
        }
      }
    }

    // Limpiar campos
    setTitulo('');
    setFechaHora('');
    setMinutos('');

    if (modo === 'temporizador' && nuevaTarea.minutos === 25) {
      mostrarToast('¡Pomodoro iniciado!');
      await Preferences.set({ key: 'pomodoroStart', value: 'true' });
      history.push('/tab2');
    } else {
      mostrarToast('Tarea creada');
      history.push('/tab3');
    }
  };

  return (
    // ... el return es exactamente igual al que tenías ...
    // (no cambió nada del JSX)
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Neon Focus</IonTitle>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={modo} onIonChange={(e) => setModo(e.detail.value as any)}>
            <IonSegmentButton value="recordatorio">
              <IonIcon icon={alarmOutline} />
              <IonLabel>Recordatorio</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="temporizador">
              <IonIcon icon={timerOutline} />
              <IonLabel>Temporizador</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="neon-content ion-padding">
        <div className="background-glow" />
        <div style={{ maxWidth: '480px', margin: '0 auto', paddingTop: '40px' }}>
          <IonText>
            <h1 style={{
              textAlign: 'center',
              fontSize: '2rem',
              marginBottom: '40px',
              fontWeight: '300',
              textShadow: '0 0 15px rgba(0, 180, 216, 0.6)'
            }}>
              {modo === 'recordatorio' ? 'Nuevo Recordatorio' : 'Nuevo Temporizador'}
            </h1>
          </IonText>

          <IonItem className="neon-item">
            <IonInput
              placeholder="Título de la tarea"
              value={titulo}
              onIonChange={(e) => setTitulo(e.detail.value ?? '')}
              clearInput
            />
          </IonItem>

          {modo === 'recordatorio' ? (
            <IonItem className="neon-item">
              <IonDatetime
                displayFormat="DD MMM YYYY - HH:mm"
                placeholder="Selecciona fecha y hora"
                value={fechaHora}
                onIonChange={(e) => setFechaHora(e.detail.value as string)}
              />
            </IonItem>
          ) : (
            <IonItem className="neon-item">
              <IonInput
                type="number"
                placeholder="Duración en minutos (25 = Pomodoro)"
                value={minutos}
                onIonChange={(e) => setMinutos(e.detail.value ?? '')}
              />
            </IonItem>
          )}

          <IonButton expand="block" color="primary" className="neon-button" style={{ marginTop: '30px' }} onClick={crearTarea}>
            <IonIcon slot="start" icon={addOutline} />
            Crear
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;