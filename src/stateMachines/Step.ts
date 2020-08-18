/**
 * Interface for a very general step type
 */
interface Step<T, P> {
    (context: T, result?: P): [P, Step<T,P>?];
}