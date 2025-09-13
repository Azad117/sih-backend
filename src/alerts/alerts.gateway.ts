import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true })
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private activeStations: Map<number, Set<string>> = new Map(); // stationId -> clientIds

  // 🚨 send alert to a specific police station
  sendToPolice(stationId: number, alert: any) {
    this.server.to(`station_${stationId}`).emit('alert', alert);
  }

  // 📍 send live tourist position update to a station
  sendTouristUpdate(stationId: number, tourist: any) {
    this.server.to(`station_${stationId}`).emit('tourist_update', tourist);
  }

  sendPanicAlertToPolice(stationId: number, alert: any) {
    this.server.to(`station_${stationId}`).emit('panic-alert', alert);
  }

  // 📍 broadcast tourist removal (e.g., when out of range or inactive)
  sendTouristRemoval(stationId: number, touristId: string) {
    this.server.to(`station_${stationId}`).emit('tourist_removed', { touristId });
  }

  // 🛠️ when a police client connects, put them into their "station room"
  handleConnection(client: Socket) {
    const stationId = client.handshake.query.stationId;
    if (stationId && !isNaN(Number(stationId))) {
      const idNum = Number(stationId);
      client.join(`station_${idNum}`);

      if (!this.activeStations.has(idNum)) {
        this.activeStations.set(idNum, new Set());
      }
      this.activeStations.get(idNum)?.add(client.id);

      console.log(`Police station ${idNum} connected (client: ${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    for (const [stationId, clients] of this.activeStations.entries()) {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        console.log(`Police station ${stationId} disconnected (client: ${client.id})`);

        if (clients.size === 0) {
          this.activeStations.delete(stationId);
        }
        break;
      }
    }
  }
}
