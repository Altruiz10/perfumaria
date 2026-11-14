import { InMemoryOrderRepository } from "./in-memory-order-repository";
import { describeOrderRepositoryContract } from "./order-repository.contract";

describeOrderRepositoryContract("in-memory", () => new InMemoryOrderRepository());
