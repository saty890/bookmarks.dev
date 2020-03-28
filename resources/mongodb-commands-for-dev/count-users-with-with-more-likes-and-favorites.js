db.users.count( { $where: "this.favorites.length > 5" } );

// list users
db.users.find( { $where: "this.favorites.length > 5" } ).pretty();


db.users.count( { $where: "this.likes.length > 2" } );
//list users
db.users.find( { $where: "this.likes.length > 2" } ).pretty();
