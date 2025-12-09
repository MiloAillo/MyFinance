const DB_VERSION = 4
export async function DBSupportCheck() {
    const db = await indexedDB.databases()
    console.log("db check:", db)
    return db ? true : false  
}

export async function DBcheck() {
    const db = await indexedDB.databases()
    const dbExists = db.some(db => db.name === "MyFinance");
    if(dbExists) {
        return dbExists
    } else {
        return null
    }
}

export async function DBcreate(name: string) {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)
    
        request.onupgradeneeded = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result
    
            // create and add user table
            let user = db.createObjectStore("user", {keyPath: "id"})
            user.createIndex("name", "name", {unique: false})
            user.add({id: 1, name: name})
            
            // create trackers table
            let trackers = db.createObjectStore("trackers", {keyPath: "id", autoIncrement: true})
            trackers.createIndex("name", "name", {unique: false})

            // create transactions table
            let transactions = db.createObjectStore("transactions", {keyPath: "id", autoIncrement: true})
            transactions.createIndex("tracker_id", "tracker_id", {unique: false})
            transactions.createIndex("type", "type", { unique: false })
            transactions.createIndex("tracker_type", ["tracker_id", "type"], { unique: false } )
        }
    
        request.onerror = () => reject("DB Error")
    
        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            db.close()
            resolve(true)
        }
    })
}

export async function DBgetname() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            let req = e.target as IDBOpenDBRequest
            let db = req.result

            const transaction = db.transaction("user", "readonly")
            const userStore = transaction.objectStore("user")

            const userData = userStore.get(1)
            userData.onsuccess = () => {
                db.close()
                resolve(userData.result)
            }

            userData.onerror = () => {
                db.close()
                reject("get request error")
            }
        }

        request.onerror = () => reject("DB Error")
    })
}

export async function DBdelete() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let request = indexedDB.deleteDatabase("MyFinance")

            request.onsuccess = () => resolve("deleted!")
            request.onblocked = () => reject("delete request blocked!")
        }, 1000)
    })
}

export async function DBchangename(name: string) {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("user", "readwrite")
            const userStore = transaction.objectStore("user")

            const editReq = userStore.put({id: 1, name: name})
            editReq.onsuccess = () => {
                db.close()
                resolve("success")
            }
            editReq.onerror = () => {
                db.close()
                reject("edit req error!")
            }
        }
        request.onerror = () => reject("DB Error!")
    })
}

export async function DBcreatetracker(name: string, description: string, initialBalance: number) {
    return new Promise((resolve, reject) => {
        if(name === undefined || description === undefined || initialBalance === undefined) reject(`name is ${name}, description is ${description}, initialBalance is ${initialBalance}`)

        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("trackers", "readwrite")
            const trackersStore = transaction.objectStore("trackers")

            const createReq = trackersStore.add({name: name, description: description, initialBalance: initialBalance})
            createReq.onsuccess = () => {
                db.close()
                resolve("success")
            }
            createReq.onerror = () => {
                db.close()
                reject("create req error!")
            }
        }
        request.onerror = () => reject("DB Error!")
    })
}

export async function DBgetalltrackers() {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("trackers", "readonly")
            const userStore = transaction.objectStore("trackers")

            const getReq = userStore.getAll()
            getReq.onsuccess = () => {
                db.close()
                resolve(getReq.result)
            }
            getReq.onerror = () => {
                db.close()
                reject("get req error!")
            }
        }
        request.onerror = () => reject("DB Error!")
    })
}

export async function DBgetonetracker(id: number) {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("trackers", "readonly")
            const userStore = transaction.objectStore("trackers")

            const getReq = userStore.get(id)
            getReq.onsuccess = () => {
                db.close()
                resolve(getReq.result)
            }
            getReq.onerror = () => {
                db.close()
                reject("get req error!")
            }
        }
        request.onerror = () => reject("DB Error!")
    })
}

export async function DBgetalltransactions(tracker_id: number) {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("transactions", "readonly")
            const transactionsStore = transaction.objectStore("transactions")
            const index = transactionsStore.index("tracker_id")

            const getReq = index.getAll(tracker_id)
            getReq.onsuccess = () => {
                db.close()
                resolve(getReq.result)
            }
            getReq.onerror = () => {
                db.close()
                reject("get req error")
            }
        }
        request.onerror = () => reject("DB Error!")
    })
}

export async function DBaddincome(name: string, desc: string | null, image: File | null, date: Date, tracker_id: number, income: number) {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("transactions", "readwrite")
            const transactionsStore = transaction.objectStore("transactions")


            const addReq = transactionsStore.add({name: name, desc: desc ? desc : null, image: image ? image : null, date: date, tracker_id: tracker_id, type: "income", income: income})
            addReq.onsuccess = () => {
                db.close()
                resolve(addReq.result)
            }
            addReq.onerror = () => {
                db.close()
                reject("get req error")
            }
        }
        request.onerror = () => reject("DB Error!")
    })
}

export async function DBaddoutcome(name: string, desc: string | null, image: File | null, date: Date, tracker_id: number, income: number) {
    return new Promise((resolve, reject) => {
        let request = indexedDB.open("MyFinance", DB_VERSION)

        request.onsuccess = (e) => {
            const req = e.target as IDBOpenDBRequest
            const db = req.result

            const transaction = db.transaction("transactions", "readwrite")
            const transactionsStore = transaction.objectStore("transactions")


            const addReq = transactionsStore.add({name: name, desc: desc ? desc : null, image: image ? image : null, date: date, tracker_id: tracker_id, type: "outcome", income: income})
            addReq.onsuccess = () => {
                db.close()
                resolve(addReq.result)
            }
            addReq.onerror = () => {
                db.close()
                reject("get req error")
            }
        }
        request.onerror = () => reject("DB Error!")
    })   
}
// dont forget to close the connection