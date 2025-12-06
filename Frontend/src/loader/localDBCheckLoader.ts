const localDBCheckLoader = async () => {
    const db = await indexedDB.databases()
    console.log("db check:", db)
    if(db[0]?.name === "MyFinance") {
        window.location.href = "/app"
    } else {
        return true
    }
}

export default localDBCheckLoader