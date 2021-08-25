import { Injectable, Module } from '@nestjs/common'

const defaultConcurrency = 4

@Injectable()
export class TaskQueueService {
    private readonly concurrency: number = defaultConcurrency

    private queue: Array<() => Promise<unknown>> = []

    public pop(): number {
        for (let i = 0; i < this.concurrency; i++) {
            if (this.queue.length > 0) {
                this.queue.pop()?.call(undefined)
            } else {
                return i
            }
        }

        return this.concurrency - 1
    }

    public push<T>(fn: () => Promise<T>): void {
        this.queue.push(fn)
        setImmediate(() => this.pop())
    }

    public unshift<T>(fn: () => Promise<T>): void {
        this.queue.unshift(fn)
        setImmediate(() => this.pop())
    }
}

@Module({
    exports: [TaskQueueService],
    providers: [TaskQueueService],
})
export class TaskQueueModule {}
