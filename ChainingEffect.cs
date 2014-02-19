using UnityEngine;
using System.Collections.Generic;

public class ChainingEffect : MonoBehaviour {
	public ChainingStateIndicator chainingStateIndicator;
	public GameObject prefabChainingLine;
	public Vector3 lastPos;
	private List<ChainingLine> chainingLines;

	void Start() {
		chainingLines = new List<ChainingLine>();
		chainingStateIndicator = GetComponentInChildren<ChainingStateIndicator>();
	}

	public void appendChain(Vector3 position, Vector3 lastPos) {
		GameObject lineObj = (GameObject)Instantiate(prefabChainingLine);
		ChainingLine currentLine = lineObj.GetComponent<ChainingLine>();
		chainingLines.Add(currentLine);
		currentLine.init(position);
		this.lastPos = lastPos;
		arrangeLines();
	}

	public void removeChain(Vector3 tilePos) {
		foreach (ChainingLine chainingLine in chainingLines) {
			if (chainingLine.begin == tilePos) {
				Destroy(chainingLine);
				chainingLines.Remove(chainingLine);
				return;
			}
		}
		arrangeLines();
	}

	private void arrangeLines() {
		if (chainingLines.Count > 2) {
			foreach (ChainingLine line in chainingLines) {
				line.setEndPosition(lastPos);
			}
		}
		else {
			foreach (ChainingLine line in chainingLines) {
				line.clear();
			}
		}
	}

	public void resetChain() {
		foreach (ChainingLine chainingLine in chainingLines) {
			chainingLine.destroy();
		}
		chainingLines.Clear();
	}
}