import pytest
from unittest.mock import patch
from src.query_runner import QueryRunner, QueryOutput


class TestQueryOutput:

    def test_to_dict_returns_correct_structure(self):
        output = QueryOutput(5, "Test?", {"openai": "answer", "anthropic": "response"})
        result = output.to_dict()

        assert result == {'id': 5, 'question': "Test?", 'response': {"openai": "answer", "anthropic": "response"}}


class TestLoadQueries:

    def test_returns_dict_with_queries(self):
        result = QueryRunner.load_queries()

        assert isinstance(result, dict)
        assert 'queries' in result
        if result['queries']:
            assert 'id' in result['queries'][0]
            assert 'query' in result['queries'][0]


class TestGetCompletedIds:

    def test_finds_output_files(self):
        fake_files = ["output_1.json", "output_100.json", "summary.json", "readme.txt"]

        with patch('os.listdir', return_value=fake_files):
            result = QueryRunner.get_completed_ids("fake/path")

        assert result == {1, 100}

    def test_empty_dir_returns_empty_set(self):
        with patch('os.listdir', return_value=[]):
            result = QueryRunner.get_completed_ids("fake/path")

        assert result == set()


class TestFilterQueries:

    @pytest.fixture
    def queries(self):
        return [{'id': i, 'query': f'Q{i}'} for i in range(1, 6)]

    def test_no_filters_returns_all(self, queries):
        assert len(QueryRunner.filter_queries(queries)) == 5

    def test_filters_by_ids(self, queries):
        result = QueryRunner.filter_queries(queries, ids={2, 4})
        assert [q['id'] for q in result] == [2, 4]

    def test_filters_by_start_and_limit(self, queries):
        result = QueryRunner.filter_queries(queries, start=2, limit=2)
        assert [q['id'] for q in result] == [2, 3]

class TestParseArgs:

    def test_parses_all_arguments(self):
        with patch('sys.argv', ['qr.py', '--start', '5', '--limit', '10', '--ids', '1,2', '--resume', 'path/']):
            from src.query_runner import parse_args
            args = parse_args()

            assert args.start == 5
            assert args.limit == 10
            assert args.ids == '1,2'
            assert args.resume == 'path/'

    def test_defaults_to_none(self):
        with patch('sys.argv', ['qr.py']):
            from src.query_runner import parse_args
            args = parse_args()

            assert (args.start, args.limit, args.ids, args.resume) == (None, None, None, None)
