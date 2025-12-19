import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar,
  IonSegment, IonSegmentButton, IonLabel, IonIcon, IonInput,
  IonButton, IonDatetime, IonItem, IonText, useIonToast, IonModal,
  IonButtons, IonFooter
} from '@ionic/react';
import { alarmOutline, timerOutline, addOutline, calendarOutline, checkmarkOutline, closeOutline } from 'ionicons/icons';
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
  const [fechaHoraTemp, setFechaHoraTemp] = useState(''); // Valor temporal en el modal
  const [fechaHora, setFechaHora] = useState(''); // Valor confirmado
  const [minutos, setMinutos] = useState('');
  const [present] = useIonToast();
  const history = useHistory();
  const [showDatetimeModal, setShowDatetimeModal] = useState(false);

  const mostrarToast = (message: string) => {
    present({
      message,
      duration: 2000,
      color: 'primary',
      position: 'top'
    });
  };

  // --- NUEVAS FUNCIONES DE CONFIGURACIÓN DE NOTIFICACIONES ---

  const setupNotificationChannel = async () => {
    // Crea el canal de Android. Esto solo se ejecuta una vez por instalación.
    await LocalNotifications.createChannel({
      id: 'neon-focus-notifications',
      name: 'Alertas de Neon Focus',
      description: 'Canal para recordatorios y temporizadores',
      importance: 5, // Importancia máxima (sonido, vibración)
      visibility: 1,
      sound: 'default'
    });
  };

  const checkAndRequestPermissions = async () => {
    // Pide permisos al cargar la pestaña por si acaso
    let permStatus = await LocalNotifications.checkPermissions();

    if (permStatus.display !== 'granted') {
      permStatus = await LocalNotifications.requestPermissions();
    }
    
    // Si aún no se conceden, mostramos un mensaje, aunque la lógica de crearTarea también lo pide.
    if (permStatus.display !== 'granted') {
      mostrarToast('Permisos de notificación no concedidos. Las alertas no funcionarán.');
    }
  };

  useEffect(() => {
    // Llama a estas funciones al montar el componente
    setupNotificationChannel();
    checkAndRequestPermissions();
  }, []);

  // --- FIN DE NUEVAS FUNCIONES ---

  const abrirModalDatetime = () => {
    setFechaHoraTemp(fechaHora || new Date().toISOString());
    setShowDatetimeModal(true);
  };

  const confirmarFechaHora = () => {
    setFechaHora(fechaHoraTemp);
    setShowDatetimeModal(false);
  };

  const cancelarFechaHora = () => {
    setShowDatetimeModal(false);
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

    // Ya no es necesario llamar a requestPermissions aquí si se hace en useEffect, 
    // pero si lo dejas tampoco pasa nada, solo es redundante.
    // await LocalNotifications.requestPermissions();

    // NOTIFICACIÓN PARA RECORDATORIO (MODIFICADA)
    if (modo === 'recordatorio' && nuevaTarea.fechaHora) {
      const timestamp = new Date(nuevaTarea.fechaHora).getTime();
      if (timestamp > Date.now()) {
        await LocalNotifications.schedule({
          notifications: [{
            id: nuevaTarea.id,
            title: '🔔 Neon Focus - Recordatorio',
            body: nuevaTarea.titulo,
            channelId: 'neon-focus-notifications', // <-- AÑADIDO
            schedule: { 
                at: new Date(timestamp),
                allowWhileIdle: true // <-- AÑADIDO para Android 12+
            },
            sound: 'default'
          }]
        });
      }
    }

    // NOTIFICACIÓN PARA TEMPORIZADOR (MODIFICADA)
    if (modo === 'temporizador' && nuevaTarea.minutos) {
      const segundosTotal = nuevaTarea.minutos * 60;
      const finalTimestamp = Date.now() + segundosTotal * 1000;
      await LocalNotifications.schedule({
        notifications: [{
          id: nuevaTarea.id + 100000,
          title: '⏰ Neon Focus - Temporizador terminado',
          body: `"${nuevaTarea.titulo}" ha finalizado`,
          channelId: 'neon-focus-notifications', // <-- AÑADIDO
          schedule: { 
            at: new Date(finalTimestamp),
            allowWhileIdle: true // <-- AÑADIDO para Android 12+
        },
          sound: 'default'
        }]
      });
    }

    setTitulo('');
    setFechaHora('');
    setMinutos('');

    if (modo === 'temporizador' && nuevaTarea.minutos === 25) {
      mostrarToast('¡Pomodoro iniciado!');
      await Preferences.set({ key: 'pomodoroStart', value: 'true' });
      history.push('/tab2');
    } else {
      mostrarToast('Tarea creada con notificación');
      history.push('/tab3');
    }
  };

  return (
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
            <IonItem className="neon-item" button onClick={abrirModalDatetime}>
              <IonIcon icon={calendarOutline} slot="start" />
              <IonLabel>Fecha y hora</IonLabel>
              <IonText slot="end" color="medium">
                {fechaHora ? new Date(fechaHora).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Seleccionar'}
              </IonText>
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

        {/* Modal con botón Aceptar */}
        <IonModal isOpen={showDatetimeModal} onDidDismiss={cancelarFechaHora} className="datetime-modal">
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Seleccionar fecha y hora</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={cancelarFechaHora}>
                  <IonIcon icon={closeOutline} />
                </IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonDatetime
              presentation="date-time"
              locale="es-ES"
              value={fechaHoraTemp}
              onIonChange={(e) => setFechaHoraTemp(e.detail.value as string)}
              preferWheel={true}
              hourCycle="h23"
              min={new Date().toISOString()}
              size="cover"
            />
          </IonContent>
          <IonFooter>
            <IonToolbar>
              <IonButton expand="block" color="secondary" onClick={confirmarFechaHora}>
                <IonIcon slot="start" icon={checkmarkOutline} />
                Aceptar
              </IonButton>
            </IonToolbar>
          </IonFooter>
        </IonModal>
      </IonContent>
    </IonPage>
  );
};

export default Tab1;
