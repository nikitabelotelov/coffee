/// <amd-module name='View/_Request/_Storage/Object' />
import {IStorage} from "View/_Request/Interface/IStorage";

/**
 * Класс, реализующий интерфейс {@link Core/Request/IStorage}, сохраняющий данные в внутренний объект
 * @class
 * @name View/_Request/_Storage/Object
 * @implements Core/Request/IStorage
 * @author Заляев А.В
 */
class ObjectStorage implements IStorage {
    private _map: HashMap<string> = Object.create(null);
    get(key: string): string | null {
        return this._map[key] || null;
    };
    set(key: string, value: string): boolean {
        this._map[key] = value;
        return true;
    };
    remove(key: string): void {
        delete this._map[key];
    };
    getKeys(): string[] {
        return Object.keys(this._map);
    };
    toObject(): HashMap<string> {
        return {
            ...this._map
        }
    };
}

export default ObjectStorage;
