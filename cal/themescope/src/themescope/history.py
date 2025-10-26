import os
import sqlite3
import datetime as dt
import tempfile
import shutil
from dataclasses import dataclass
from typing import Optional

import pandas as pd

EPOCH = dt.datetime(1601, 1, 1)  # Chrome WebKit epoch


@dataclass
class Visit:
	url: str
	title: str
	visit_time: dt.datetime
	visit_count: int
	typed_count: int


class ChromeHistoryReader:
	def __init__(self, db_path: str):
		self.db_path = db_path

	def _connect(self, path: str):
		# Open a connection to the provided SQLite path
		return sqlite3.connect(path)

	@staticmethod
	def webkit_to_dt(micro_since_epoch: int) -> dt.datetime:
		# Chrome stores microseconds since 1601-01-01
		return EPOCH + dt.timedelta(microseconds=micro_since_epoch)

	def _read_history_file(self, path: str) -> pd.DataFrame:
		# Copy to a temporary file to avoid "database is locked" when Chrome is running
		tmp_fd, tmp_path = tempfile.mkstemp(prefix="chrome_history_", suffix=".db")
		os.close(tmp_fd)
		shutil.copy2(path, tmp_path)

		conn = self._connect(tmp_path)
		try:
			query = """
			SELECT
			  urls.url as url,
			  urls.title as title,
			  urls.visit_count as visit_count,
			  urls.typed_count as typed_count,
			  visits.visit_time as visit_time
			FROM urls
			JOIN visits ON urls.id = visits.url
			"""
			df = pd.read_sql_query(query, conn)
		finally:
			conn.close()
			try:
				os.remove(tmp_path)
			except Exception:
				pass
		return df

	def load(self, since: Optional[dt.datetime] = None, until: Optional[dt.datetime] = None, include_archived: bool = False) -> pd.DataFrame:
		# Read current history
		dfs = [self._read_history_file(self.db_path)]
		if include_archived:
			profile_dir = os.path.dirname(self.db_path)
			archived_path = os.path.join(profile_dir, "Archived History")
			if os.path.exists(archived_path):
				try:
					dfs.append(self._read_history_file(archived_path))
				except Exception:
					# Ignore archived read failures; continue with main DB
					pass

		df = pd.concat(dfs, ignore_index=True)

		# Convert Chrome microseconds since 1601-01-01 to pandas datetime64[ns]
		df["visit_time"] = df["visit_time"].apply(lambda x: self.webkit_to_dt(int(x)))
		df["visit_time"] = pd.to_datetime(df["visit_time"])  # ensure datetime64[ns]
		if since is not None:
			df = df[df["visit_time"] >= since]
		if until is not None:
			df = df[df["visit_time"] <= until]
		df.sort_values("visit_time", inplace=True)
		return df.reset_index(drop=True)
