# 🏗️ Sistem Mimarisi

## Event-Driven Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Smart Tracking System                         │
└─────────────────────────────────────────────────────────────────────┘

                          ┌────────────────┐
                          │   Dashboard    │
                          │  (Next.js)     │
                          │  :3000         │
                          └────────┬───────┘
                                   │
           ┌───────────────────────┼───────────────────────┐
           │                       │                       │
           ▼                       ▼                       ▼
    ┌────────────────┐      ┌────────────────┐     ┌────────────────┐
    │  Package       │      │   Tracking     │     │  Notification  │
    │  Service       │      │   Service      │     │   Service      │
    │  :3001         │      │   :3002        │     │   :3003        │
    │                │      │                │     │                │
    │ REST/HTTP      │      │ Event Handler  │     │ Event Handler  │
    │ Port: 3001     │      │ Port: 3002     │     │ Port: 3003     │
    └────────┬───────┘      └────────┬───────┘     └────────┬───────┘
             │                       │                       │
             │ Publishes             │ Publishes            │ Subscribes
             │ "package.created"     │ "package.delivered"  │ "package.delivered"
             │                       │                       │
             └──────────┬────────────┴────────────┬──────────┘
                        │                        │
                        ▼                        ▼
            ┌──────────────────────┐  ┌──────────────────────┐
            │   package.exchange   │  │  tracking.exchange   │
            │   (Topic Exchange)   │  │  (Topic Exchange)    │
            │                      │  │                      │
            │ RabbitMQ             │  │ RabbitMQ             │
            │ :5672                │  │ :5672                │
            └──────┬───────────────┘  └─────┬────────────────┘
                   │                        │
                   │ Routes to              │ Routes to
                   │                        │
        ┌──────────┴─────────┐              │
        │                    │              │
        ▼                    ▼              ▼
    ┌─────────────────┐  ┌─────────────────────────────┐
    │ Tracking       │  │ Notification                │
    │ Package Created│  │ Package Delivered           │
    │ Queue          │  │ Queue                       │
    │                │  │                             │
    │ Durable: true  │  │ Durable: true               │
    │ noAck: false   │  │ noAck: false                │
    └────────┬───────┘  └────────┬────────────────────┘
             │                   │
             ▼                   ▼
    ┌─────────────────┐  ┌─────────────────────────────┐
    │  MongoDB        │  │  MongoDB                    │
    │  tracking_db    │  │  notification_db            │
    │  :27018         │  │  :27019                     │
    │                 │  │                             │
    │ Tracking Docs   │  │ Notification Logs           │
    │ Status Updates  │  │ Delivery Status             │
    └─────────────────┘  └─────────────────────────────┘

    ┌─────────────────────────────────────────────────────┐
    │  MongoDB Package DB (:27017)                        │
    │  Package Service Stores Initial Packages Here       │
    │  (Barcode, Sender, Receiver, Initial Status)        │
    └─────────────────────────────────────────────────────┘

```

## Message Flow Timeline

```
TIME    Package Service         RabbitMQ              Tracking Service        Notification Service
────    ────────────────         ─────────              ─────────────────       ────────────────────
 0ms    POST /packages
        Create Package ✓
        Generate Barcode ✓
        Save to DB ✓
        │
        └──> Emit "package.created" ──────────────────┐
                                                       │
                                                  Route to Queue
                                                  tracking.package.created.queue
                                                       │
                                    ┌─────────────────┘
                                    │
10ms                           Consume Message ✓
                               Save to tracking_db ✓
                               Start Status Simulation
                               └──> Start Timer (10s intervals)
                                    Hazırlanıyor
                                    │
                                    └──> Update DB
                                         Status = "Yolda"

20ms                                                              [Status transitions continue]

30ms                                                              [Status = "Dağıtımda"]

40ms                                                              [Status = "Teslim Edildi"] ✓
                                                                  │
                                                  Emit "package.delivered" ──────┐
                                                                                  │
                                                                            Route to Queue
                                                                       notification.package.delivered.queue
                                                                                  │
                                                             ┌────────────────────┘
                                                             │
45ms                                                    Consume Message ✓
                                                        Log to Console ✓
                                                        Save to notification_db ✓
                                                        Mark as "Sent" ✓

```

## Database Schema per Service

```

┌───────────────────────────────────────────┐
│  PACKAGE_DB (MongoDB)                     │
├───────────────────────────────────────────┤
│ Collections:                              │
│                                           │
│ packages {                                │
│   _id: ObjectId                           │
│   barcode: "PKG-...",         (unique)    │
│   sender: "Ali Veli",                     │
│   receiver: "Mehmet Turan",               │
│   status: "Hazırlanıyor",                 │
│   createdAt: Date,                        │
│   updatedAt: Date                         │
│ }                                         │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  TRACKING_DB (MongoDB)                    │
├───────────────────────────────────────────┤
│ Collections:                              │
│                                           │
│ trackings {                               │
│   _id: ObjectId                           │
│   barcode: "PKG-...",         (unique)    │
│   currentStatus: "Yolda",                 │
│   sender: "Ali Veli",                     │
│   receiver: "Mehmet Turan",               │
│   deliveredAt: Date (optional),           │
│   deliveryEventPublished: boolean,        │
│   updatedAt: Date,                        │
│   createdAt: Date                         │
│ }                                         │
└───────────────────────────────────────────┘

┌───────────────────────────────────────────┐
│  NOTIFICATION_DB (MongoDB)                │
├───────────────────────────────────────────┤
│ Collections:                              │
│                                           │
│ notifications {                           │
│   _id: ObjectId                           │
│   barcode: "PKG-...",                     │
│   messageContent: "🚨 Sayın Müşteri...",  │
│   sentAt: Date,                           │
│   deliveryStatus: "Sent",                 │
│   createdAt: Date,                        │
│   updatedAt: Date                         │
│ }                                         │
└───────────────────────────────────────────┘

```

## RabbitMQ Configuration

```
┌──────────────────────────────────────────────────┐
│         RabbitMQ Message Broker                  │
├──────────────────────────────────────────────────┤
│                                                  │
│  Exchanges (Topic Type):                        │
│  ├─ package.exchange                            │
│  │  └─ Routing Keys:                            │
│  │     └─ package.created                       │
│  │                                              │
│  └─ tracking.exchange                           │
│     └─ Routing Keys:                            │
│        └─ package.delivered                     │
│                                                  │
│  Queues (Durable, noAck=false):                │
│  ├─ tracking.package.created.queue              │
│  │  └─ Bound to: package.exchange               │
│  │     Routing Key: package.created             │
│  │     Consumer: Tracking Service               │
│  │                                              │
│  └─ notification.package.delivered.queue        │
│     └─ Bound to: tracking.exchange              │
│        Routing Key: package.delivered           │
│        Consumer: Notification Service           │
│                                                  │
│  Configuration:                                 │
│  ├─ durable: true (survives broker restart)    │
│  ├─ autoDelete: false                          │
│  ├─ x-max-priority: 10 (priority support)      │
│  ├─ prefetch: 1 (one message at a time)        │
│  └─ heartbeat: 60s (connection health)         │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                   Production Environment                       │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Load Balancer (nginx / AWS ALB)                        │ │
│  │  Port: 80, 443 (HTTPS)                                 │ │
│  └──────────┬───────────────────────────────────────────────┘ │
│             │                                                  │
│  ┌──────────┴─────────────────────────────────────────────┐   │
│  │  Kubernetes Cluster                                    │   │
│  │                                                        │   │
│  │  ┌─ Pods Replica Set (3) ─────────────────────────┐   │   │
│  │  │                                                 │   │   │
│  │  │  Package Service       Tracking Service        │   │   │
│  │  │  Notification Service  Dashboard               │   │   │
│  │  │                                                 │   │   │
│  │  └─────────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  │  ┌─ Stateful Services ──────────────────────────────┐   │   │
│  │  │                                                  │   │   │
│  │  │  RabbitMQ (StatefulSet)                          │   │   │
│  │  │  MongoDB Package DB (StatefulSet)                │   │   │
│  │  │  MongoDB Tracking DB (StatefulSet)               │   │   │
│  │  │  MongoDB Notification DB (StatefulSet)           │   │   │
│  │  │                                                  │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                        │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Monitoring & Logging                                   │ │
│  │  ├─ Prometheus (Metrics)                               │ │
│  │  ├─ Grafana (Dashboards)                               │ │
│  │  ├─ ELK Stack (Logging)                                │ │
│  │  └─ Jaeger (Distributed Tracing)                       │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## Resilience & High Availability

```
Failure Scenarios & Recovery:

1. Service Down
   ├─ Kubernetes: Auto-restarts pod
   ├─ RabbitMQ: Messages stay in queue
   ├─ Recovery: Service resumes processing
   └─ SLA: 99.9% uptime with 3 replicas

2. Database Connection Lost
   ├─ Connection pooling: Reconnect automatically
   ├─ Retry logic: Exponential backoff
   ├─ Circuit breaker: Fail fast & recover
   └─ Fallback: Queue messages locally

3. RabbitMQ Broker Down
   ├─ Durable queues: Persist on disk
   ├─ Replication: RabbitMQ cluster mode
   ├─ Message acknowledgment: No data loss
   └─ Health checks: Fast detection & failover

4. Network Partition
   ├─ Heartbeat mechanism: Detect disconnection
   ├─ Service mesh (Istio): Retry & circuit breaking
   ├─ Bulkhead pattern: Isolate failures
   └─ Graceful degradation: Continue operation

Recovery Time Objectives (RTO):
├─ Pod failure: < 30 seconds
├─ Network partition: < 60 seconds
├─ RabbitMQ broker failure: < 5 minutes
└─ Database failure: < 10 minutes

Recovery Point Objectives (RPO):
├─ Application: 0 (event-driven, no data loss)
├─ Database: 0 (MongoDB replication)
└─ Messages: 0 (RabbitMQ durability)
```

## Technology Stack Summary

```
Frontend Layer
    ├─ Next.js 14
    ├─ React 18
    └─ TailwindCSS

Application Layer
    ├─ NestJS 10
    ├─ TypeScript 5
    ├─ Express.js (HTTP)
    └─ @nestjs/microservices (RabbitMQ)

Data Layer
    ├─ MongoDB 7
    ├─ Mongoose (ODM)
    └─ Connection Pooling

Message Layer
    ├─ RabbitMQ 3.13
    ├─ AMQP Protocol
    └─ Topic-based Routing

Deployment Layer
    ├─ Docker
    ├─ Kubernetes
    ├─ Docker Compose
    └─ CI/CD (GitHub Actions)

Monitoring & Observability
    ├─ Prometheus
    ├─ Grafana
    ├─ ELK Stack
    └─ Distributed Tracing
```

---

**Architecture Version:** 1.0.0  
**Last Updated:** 19 Mayıs 2026  
**Designed for:** Production-Ready Microservices
