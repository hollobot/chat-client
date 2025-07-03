// fs 是 Node.js 提供的文件系统模块（File System），用于执行文件和目录的操作，例如读取、写入、
// const { add_tables, add_index, alter_tables } = require("./initTable");
import { add_tables, add_index, alter_tables } from "./initTable";

const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const os = require("os");
const NODE_ENV = process.env.NODE_ENV;

// 获取系统用户的个人文件夹 C:\Users\用户名
const userDir = os.homedir();
const dbFolder = userDir + (NODE_ENV === "development" ? "\\chat-dev" : "\\chat-test");
if (!fs.existsSync(dbFolder)) {
	fs.mkdirSync(dbFolder);
}
const db = new sqlite3.Database(dbFolder + "\\local.db");

const globaColumnsMap = {};

const createTable = () => {
	return new Promise(async (resolve, reject) => {
		try {
			for (const item of add_tables) {
				// db.run(): 用于 INSERT/UPDATE/DELETE（不返回数据）。
				db.run(item);
			}

			for (const item of add_index) {
				db.run(item);
			}

			for (const item of alter_tables) {
				const fieldList = await queryAll("PRAGMA table_info(" + item.tableName + ")");
				const field = fieldList.some((row) => row.name === item.field);
				if (!field) {
					db.run(item.sql);
				}
			}
		} catch (error) {
			console.log(error);
		}
		resolve();
	});
};

/**
 * 将数据库的字段名转为驼峰式存入map里
 */
const initTableColumnsMap = async () => {
	let sql = "select name from sqlite_master where type='table'";
	const tableName = await queryAll(sql);
	for (let i = 0; i < tableName.length; i++) {
		sql = `PRAGMA table_info(${tableName[i].name})`;
		const tableInfo = await queryAll(sql);
		const columnMapItem = {};
		for (let i = 0; i < tableInfo.length; i++) {
			columnMapItem[toCamelCase(tableInfo[i].name)] = tableInfo[i].name;
		}
		globaColumnsMap[tableName[i].name] = columnMapItem;
	}
};

/**
 * 基础运行sql
 * @param {*} sql
 * @param {*} params
 * @returns
 */
const run = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		const stmt = db.prepare(sql);
		stmt.run(params, (err, row) => {
			if (err) {
				reject(err);
				return;
			}
			console.log(`sql:${sql}\nparams:${params}\nchange:${stmt.changes}`);
			console.log(stmt)
			console.log("\n\n")
			// 返回查询结果
			resolve(stmt);
		});
		// 释放资源
		stmt.finalize();
	});
};

/**
 * 插入数据
 * @param {*} tableName
 * @param {*} data
 * @returns
 */
const insert = (insertPrefix = "insert into", tableName, data, returnElement) => {
	const columnMap = globaColumnsMap[tableName];
	if (columnMap == undefined) {
		console.log("没有表名");
		return;
	}
	const dbColumns = [];
	const params = [];
	for (let item in data) {
		if (columnMap[item] && data[item] != null) {
			dbColumns.push(columnMap[item]);
			params.push(data[item]);
		}
	}
	const preper = "?".repeat(dbColumns.length).split("").join(",");
	const sql = `${insertPrefix} ${tableName} (${dbColumns.join(",")}) values (${preper})`;

	return run(sql, params);
};

/**
 * 插入数据，如果冲突就会删除，然后插入
 * @param {*} tableName
 * @param {*} data
 */
const insertOrReplace = (tableName, data) => {
	return insert("insert or replace into", tableName, data);
};

/**
 * 插入数据，如果冲突,则忽略此次插入,不会报错.
 * @param {*} tableName
 * @param {*} data
 */
const insertOrIgnore = (tableName, data) => {
	return insert("insert or ignore into", tableName, data);
};

const update = (tableName, data, whereData) => {
	const columnMap = globaColumnsMap[tableName];
	if (columnMap == undefined) {
		console.log("没有表名");
		return;
	}
	const dbColumns = [];
	const wehereColumns = [];
	const params = [];

	for (let item in data) {
		if (columnMap[item] && data[item] != null) {
			dbColumns.push(`${columnMap[item]}=?`);
			params.push(data[item]);
		}
	}

	for (let item in whereData) {
		if (columnMap[item] && whereData[item] != null) {
			wehereColumns.push(`${columnMap[item]}=?`);
			params.push(whereData[item]);
		}
	}

	const sql = `update ${tableName} set ${dbColumns.join(",")} ${wehereColumns.length > 0 ? "where" : ""} ${wehereColumns.join(" and ")}`;
	return run(sql, params);
};

/**
 * 查询数据的数量
 * @param {*} sql
 * @param {*} params
 * @returns
 */
const queryCount = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		const stmt = db.prepare(sql);
		// stmt.get() 返回数据行的第一条
		stmt.get(params, (err, row) => {
			if (err) {
				resolve(0);
			}
			console.log(`sql:${sql}\nparams:${params}\n\n`);
			// 返回查询结果
			resolve(Array.from(Object.values(row))[0]);
		});
		// 释放资源
		stmt.finalize();
	});
};

/**
 * 查询单个表数据
 * @param {*} sql
 * @param {*} params
 * @returns
 */
const queryOne = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		const stmt = db.prepare(sql);
		stmt.get(params, (err, row) => {
			if (err) {
				resolve({});
			}
			console.log(`sql:${sql}\nparams:${params}\n\n`);
			// 返回查询结果
			resolve(dbToJsObject(row));
		});
		// 释放资源
		stmt.finalize();
	});
};

/**
 * 查询所有表数据
 * @param {*} sql
 * @param {*} params
 * @returns
 */
const queryAll = (sql, params = []) => {
	return new Promise((resolve, reject) => {
		const stmt = db.prepare(sql);
		//stmt.all() 返回所有结果行（数组）。
		stmt.all(params, (err, row) => {
			if (err) {
				resolve([]);
			}
			row.forEach((item, index) => {
				row[index] = dbToJsObject(item);
			});
			console.log(`sql:${sql}\nparams:${params}\n\n`);
			// 返回查询结果
			resolve(row);
		});
		// 释放资源
		stmt.finalize();
	});
};

const dbToJsObject = (data) => {
	if (!data) {
		return;
	}
	const bizData = {};
	for (let item in data) {
		bizData[toCamelCase(item)] = data[item];
	}
	return bizData;
};

const toCamelCase = (str) => {
	return str.replace(/_([a-z])/g, (match, p1) => {
		return p1.toUpperCase(); // 转换匹配到的小写字母为大写字母
	});
};

/**
 * 初始化顺序执行数据库操作
 */
const init = () => {
	db.serialize(async () => {
		await createTable();
		await initTableColumnsMap();
	});
};

init();

export { run, queryOne, queryCount, queryAll, insert, insertOrIgnore, insertOrReplace, update };
